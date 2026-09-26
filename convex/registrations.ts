import { query, mutation, internalMutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth, requireAdmin, isAdmin } from "./lib/auth";
import { internal } from "./_generated/api";
import { DuplicateRegistration, insertRegistration, normalizeEmail, syncParticipantCount } from "./lib/registrationRules";
import { keyHash } from "./lib/keyHash";

export const list = query({
    args: { eventId: v.optional(v.id("events")) },
    handler: async (ctx, args) => {
        if (!(await isAdmin(ctx))) return [];
        const eventId = args.eventId;
        if (eventId) {
            return await ctx.db
                .query("registrations")
                .withIndex("by_event", (q) => q.eq("eventId", eventId))
                .collect();
        }
        return await ctx.db.query("registrations").order("desc").take(500);
    },
});

export const myRegistrations = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Autenticação necessária.");
        }
        return await ctx.db
            .query("registrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    },
});

const customData = v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean())));
const status = v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled"));

/** A signed-in member registers as themselves: the email is the account's. */
export const create = mutation({
    args: {
        eventId: v.id("events"),
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        customData,
    },
    handler: async (ctx, args) => {
        const { userId, user } = await requireAuth(ctx);
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "registration:create", userId });

        const accountEmail = (user as unknown as { email?: string }).email;
        if (accountEmail && normalizeEmail(accountEmail) !== normalizeEmail(args.email)) {
            throw new ConvexError("O email fornecido não corresponde ao da conta autenticada.");
        }
        // requireAuth returns the id as a plain string; the table stores Id<"users">
        return await insertRegistration(ctx, { ...args, userId: userId as unknown as Id<"users"> });
    },
});

/**
 * Registration without an account, for events that allow it. Most people who
 * open an event from a WhatsApp link will not create an account for a
 * sardine supper, so the event decides. Abuse is contained by three buckets
 * (per email, per browser session, and a global ceiling), a honeypot field,
 * and every guest registration waiting for the board to confirm it.
 */
export const createGuest = mutation({
    args: {
        eventId: v.id("events"),
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        customData,
        /**
         * The privacy notice was shown with the form. Managing a registration someone
         * asked for rests on art. 6(1)(b) GDPR, not on consent; this records that the
         * art. 13 information was given, and when.
         */
        privacyNotice: v.literal(true),
        /** Browser session id, the same one the assistant uses for its budget. */
        sessionId: v.string(),
        /** Hidden from people; a bot that fills it is answered as if it had succeeded. */
        website: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.website && args.website.trim()) return { status: "received" as const };

        const event = await ctx.db.get(args.eventId);
        if (!event || event.status !== "published") throw new ConvexError("Evento não encontrado.");
        // Unset means allowed: events created before the option existed are the ones
        // being shared right now, and their visitors have no account
        if (event.allowGuestRegistration === false) {
            throw new ConvexError("Inscrições só para sócios. Entre na sua conta para se inscrever.");
        }

        const email = normalizeEmail(args.email);
        if (args.sessionId.length > 100) throw new ConvexError("Sessão inválida.");
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "registration:guest:global" });
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "registration:guest:session", userId: args.sessionId });
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "registration:guest", userId: keyHash(email) });

        try {
            await insertRegistration(ctx, {
                eventId: args.eventId,
                name: args.name,
                email,
                phone: args.phone,
                customData: args.customData,
                noticeAcceptedAt: Date.now(),
            });
            return { status: "received" as const };
        } catch (error) {
            // Answered, not thrown: a thrown error also rolls back the rate-limit
            // tokens, and asking "is this email registered?" would cost nothing
            if (error instanceof DuplicateRegistration) return { status: "duplicate" as const };
            throw error;
        }
    },
});

export const updateStatus = mutation({
    args: { id: v.id("registrations"), status },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new ConvexError("Inscrição não encontrada.");
        await ctx.db.patch(args.id, { status: args.status });
        await syncParticipantCount(ctx, existing.eventId);
    },
});

/** "Confirm all pending" for an event, in one transaction. */
export const bulkUpdateStatus = mutation({
    args: { ids: v.array(v.id("registrations")), status },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.ids.length > 500) throw new ConvexError("Demasiadas inscrições de uma vez.");
        const events = new Set<Id<"events">>();
        for (const id of args.ids) {
            const row = await ctx.db.get(id);
            if (!row) continue;
            await ctx.db.patch(id, { status: args.status });
            events.add(row.eventId);
        }
        for (const eventId of events) await syncParticipantCount(ctx, eventId);
        return args.ids.length;
    },
});

/** Removes a registration outright (spam, a test); cancelling keeps the record. */
export const remove = mutation({
    args: { id: v.id("registrations") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) return;
        await ctx.db.delete(args.id);
        await syncParticipantCount(ctx, existing.eventId);
    },
});

/** Days after an event that the details of people who registered without an account are kept. */
export const GUEST_RETENTION_DAYS = 90;
/** Days a cancelled registration without an account is kept, for questions about it. */
export const CANCELLED_RETENTION_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

/**
 * Daily: registrations without an account are deleted 90 days after their event,
 * cancelled ones after 30 days. Members' registrations stay with the account.
 * The event keeps its participant count.
 */
export const purgeExpiredGuests = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const candidates = await ctx.db
            .query("registrations")
            .withIndex("by_timestamp", (q) => q.lt("timestamp", now - CANCELLED_RETENTION_DAYS * DAY))
            .take(500);
        const eventDates = new Map<string, number>();
        let removed = 0;
        for (const row of candidates) {
            if (row.userId) continue;
            if (!eventDates.has(row.eventId)) {
                const event = await ctx.db.get(row.eventId);
                eventDates.set(row.eventId, event ? new Date(event.date).getTime() : 0);
            }
            const eventAt = eventDates.get(row.eventId) ?? 0;
            if (row.status === "cancelled" || eventAt < now - GUEST_RETENTION_DAYS * DAY) {
                await ctx.db.delete(row._id);
                removed++;
            }
        }
        return removed;
    },
});
