import { query, mutation, internalMutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth, requireAdmin, isAdmin } from "./lib/auth";
import { internal } from "./_generated/api";
import { DuplicateRegistration, assertPlaceForReactivation, insertRegistration, normalizeEmail, syncParticipantCount } from "./lib/registrationRules";
import { parseEventDate } from "./lib/time";
import { keyHash } from "./lib/keyHash";
import { notifyRegistration } from "./lib/email/notify";

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

/**
 * The signed-in member's registrations with the event each one is for, newest
 * event first. Empty for visitors: the agenda asks it on every page view.
 */
export const myRegistrations = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];
        const rows = await ctx.db
            .query("registrations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .take(200);
        const withEvents = await Promise.all(rows.map(async (row) => {
            const event = await ctx.db.get(row.eventId);
            if (!event || event.status !== "published") return null;
            return {
                _id: row._id,
                eventId: row.eventId,
                status: row.status,
                timestamp: row.timestamp,
                teamName: row.teamName,
                teamMembers: row.teamMembers,
                event: { title: event.title, slug: event.slug, date: event.date, location: event.location, entryPrice: event.entryPrice },
            };
        }));
        return withEvents
            .filter((r): r is NonNullable<typeof r> => r !== null)
            .sort((a, b) => b.event.date.localeCompare(a.event.date));
    },
});

const customData = v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean())));
const status = v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled"));
const teamName = v.optional(v.string());
const teamMembers = v.optional(v.array(v.string()));

/** A signed-in member registers as themselves: the email is the account's. */
export const create = mutation({
    args: {
        eventId: v.id("events"),
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        customData,
        teamName,
        teamMembers,
    },
    handler: async (ctx, args) => {
        const { userId, user } = await requireAuth(ctx);
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "registration:create", userId });

        const accountEmail = (user as unknown as { email?: string }).email;
        if (accountEmail && normalizeEmail(accountEmail) !== normalizeEmail(args.email)) {
            throw new ConvexError("O email fornecido não corresponde ao da conta autenticada.");
        }
        // requireAuth returns the id as a plain string; the table stores Id<"users">
        const memberId = userId as unknown as Id<"users">;
        // Registered earlier from a shared link without signing in: that row becomes
        // the member's, so it shows in their area instead of a "duplicate" error
        // Only the account's own email may claim a row: an account without one claims nothing
        const earlier = accountEmail ? await ctx.db
            .query("registrations")
            .withIndex("by_event_email", (q) => q.eq("eventId", args.eventId).eq("email", normalizeEmail(accountEmail)))
            .collect() : [];
        const guestRow = earlier.find((r) => r.status !== "cancelled" && !r.userId);
        if (guestRow) {
            await ctx.db.patch(guestRow._id, { userId: memberId });
            return guestRow._id;
        }
        const id = await insertRegistration(ctx, { ...args, userId: memberId });
        await notifyRegistration(ctx, id, "received");
        return id;
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
        teamName,
        teamMembers,
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
            const id = await insertRegistration(ctx, {
                eventId: args.eventId,
                name: args.name,
                email,
                phone: args.phone,
                customData: args.customData,
                teamName: args.teamName,
                teamMembers: args.teamMembers,
                noticeAcceptedAt: Date.now(),
            });
            await notifyRegistration(ctx, id, "received");
            return { status: "received" as const };
        } catch (error) {
            // Answered, not thrown: a thrown error also rolls back the rate-limit
            // tokens, and asking "is this email registered?" would cost nothing
            if (error instanceof DuplicateRegistration) return { status: "duplicate" as const };
            throw error;
        }
    },
});

/**
 * The board writes down a registration that came by phone or in person, so the
 * site's list stays the one list. Confirmed at once, allowed while the event is
 * closed or past its deadline, and the email is optional.
 */
export const addByAdmin = mutation({
    args: {
        eventId: v.id("events"),
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        customData,
        teamName,
        teamMembers,
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const id = await insertRegistration(ctx, { ...args, email: args.email ?? "", addedByAdmin: true });
        // Written down by the board, so already confirmed: the person gets the confirmation
        await notifyRegistration(ctx, id, "confirmed");
        return id;
    },
});

/**
 * A member who cannot go frees the place themselves, until the event starts.
 * The row stays as cancelled so the board sees who dropped out.
 */
export const cancelMine = mutation({
    args: { id: v.id("registrations") },
    handler: async (ctx, args) => {
        const { userId } = await requireAuth(ctx);
        const row = await ctx.db.get(args.id);
        if (!row || row.userId !== userId) throw new ConvexError("Inscrição não encontrada.");
        if (row.status === "cancelled") return;
        const event = await ctx.db.get(row.eventId);
        const starts = event ? parseEventDate(event.date) : NaN;
        if (!Number.isNaN(starts) && starts < Date.now()) throw new ConvexError("O evento já começou. Fale com a organização.");
        await ctx.db.patch(args.id, { status: "cancelled" });
        await syncParticipantCount(ctx, row.eventId);
        await notifyRegistration(ctx, args.id, "member_cancelled");
    },
});

export const updateStatus = mutation({
    args: { id: v.id("registrations"), status },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new ConvexError("Inscrição não encontrada.");
        await assertPlaceForReactivation(ctx, existing, args.status);
        await ctx.db.patch(args.id, { status: args.status });
        await syncParticipantCount(ctx, existing.eventId);
        if (existing.status !== args.status && args.status !== "pending") await notifyRegistration(ctx, args.id, args.status);
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
            await assertPlaceForReactivation(ctx, row, args.status);
            await ctx.db.patch(id, { status: args.status });
            events.add(row.eventId);
            if (row.status !== args.status && args.status !== "pending") await notifyRegistration(ctx, id, args.status);
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

const PURGE_BATCH = 200;

/**
 * Daily: registrations without an account are deleted 90 days after their event,
 * cancelled ones after 30 days. Members' registrations stay with the account.
 * The event keeps its participant count.
 *
 * Rows that are not yet due stay in the index, so every run walks forward from
 * `after` (the last timestamp it looked at) and reschedules itself while a batch
 * comes back full; a fixed window from the start would stall on those rows.
 */
export const purgeExpiredGuests = internalMutation({
    args: { after: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const now = Date.now();
        const after = args.after ?? 0;
        const rows = await ctx.db
            .query("registrations")
            .withIndex("by_user_timestamp", (q) =>
                q.eq("userId", undefined).gt("timestamp", after).lt("timestamp", now - CANCELLED_RETENTION_DAYS * DAY))
            .take(PURGE_BATCH);
        const eventDates = new Map<string, number>();
        let removed = 0;
        for (const row of rows) {
            if (!eventDates.has(row.eventId)) {
                const event = await ctx.db.get(row.eventId);
                // An event without a readable date is judged by when the person registered
                const eventAt = event ? parseEventDate(event.date) : 0;
                eventDates.set(row.eventId, Number.isNaN(eventAt) ? row.timestamp : eventAt);
            }
            const eventAt = eventDates.get(row.eventId) ?? 0;
            if (row.status === "cancelled" || eventAt < now - GUEST_RETENTION_DAYS * DAY) {
                await ctx.db.delete(row._id);
                removed++;
            }
        }
        if (rows.length === PURGE_BATCH) {
            await ctx.scheduler.runAfter(0, internal.registrations.purgeExpiredGuests, { after: rows[rows.length - 1].timestamp });
        }
        return removed;
    },
});
