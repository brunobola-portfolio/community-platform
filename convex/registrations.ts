import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth, requireAdmin, isAdmin } from "./lib/auth";
import { internal } from "./_generated/api";
import { validateEmail, validateMaxLength } from "./lib/validation";

export const list = query({
    args: { eventId: v.optional(v.id("events")) },
    handler: async (ctx, args) => {
        if (!(await isAdmin(ctx))) return [];
        if (args.eventId) {
            return await ctx.db
                .query("registrations")
                .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
                .collect();
        }
        return await ctx.db.query("registrations").take(500);
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

export const create = mutation({
    args: {
        eventId: v.id("events"),
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        customData: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
    },
    handler: async (ctx, args) => {
        const { userId: authUserId, user: authUser } = await requireAuth(ctx);

        // Rate limit via standard checkAndConsume pattern
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "registration:create",
            userId: authUserId,
        });

        validateMaxLength(args.name, "nome", 200);
        validateMaxLength(args.email, "email", 254);

        if (!validateEmail(args.email)) {
            throw new ConvexError("Formato de email inválido.");
        }

        // Verify email matches authenticated user
        const userWithEmail = authUser as unknown as { email?: string };
        if (userWithEmail.email && userWithEmail.email !== args.email) {
            throw new ConvexError("O email fornecido não corresponde ao da conta autenticada.");
        }

        // Validate customData size
        if (args.customData && JSON.stringify(args.customData).length > 10000) {
            throw new ConvexError("Dados personalizados demasiado grandes.");
        }

        // Fetch event and validate
        const event = await ctx.db.get(args.eventId);
        if (!event) {
            throw new ConvexError("Evento não encontrado.");
        }

        // Check if registration is open
        if (event.registrationOpen === false) {
            throw new ConvexError("Inscrições encerradas para este evento.");
        }

        // Check for duplicate registration (immediately before insert to minimize race window)
        const existing = await ctx.db
            .query("registrations")
            .withIndex("by_event_email", (q) => q.eq("eventId", args.eventId).eq("email", args.email))
            .first();
        if (existing) {
            throw new ConvexError("Já existe uma inscrição com este email para este evento.");
        }

        // Count active registrations
        const activeRegistrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();
        const count = activeRegistrations.filter((r) => r.status !== "cancelled").length;

        if (event.maxParticipants !== undefined && count >= event.maxParticipants) {
            throw new ConvexError("Vagas esgotadas para este evento.");
        }

        // Optimistic insert (cast userId back to Id<"users"> for the schema)
        const typedUserId = authUserId as unknown as Id<"users">;
        const id = await ctx.db.insert("registrations", {
            eventId: args.eventId,
            name: args.name,
            email: args.email,
            phone: args.phone,
            customData: args.customData,
            userId: typedUserId,
            status: "pending",
            timestamp: Date.now(),
        });

        // Post-insert verification (rollback if capacity exceeded)
        if (event.maxParticipants !== undefined) {
            const postInsertRegs = await ctx.db
                .query("registrations")
                .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
                .collect();
            const postCount = postInsertRegs.filter((r) => r.status !== "cancelled").length;
            if (postCount > event.maxParticipants) {
                await ctx.db.delete(id);
                throw new ConvexError("Vagas esgotadas para este evento.");
            }
        }

        // Sync denormalized counter on the event. Cancellations are handled
        // in updateStatus so the card/bar always reflects active registrations.
        await ctx.db.patch(args.eventId, {
            currentParticipants: (event.currentParticipants ?? 0) + 1,
        });

        return id;
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("registrations"),
        status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled")),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Inscrição não encontrada.");

        await ctx.db.patch(args.id, { status: args.status });

        // Keep event.currentParticipants in sync when transitioning
        // to/from "cancelled" — the only state that removes the slot.
        const wasCancelled = existing.status === "cancelled";
        const isCancelled = args.status === "cancelled";
        if (wasCancelled !== isCancelled) {
            const event = await ctx.db.get(existing.eventId);
            if (event) {
                const delta = isCancelled ? -1 : 1;
                const next = Math.max(0, (event.currentParticipants ?? 0) + delta);
                await ctx.db.patch(existing.eventId, { currentParticipants: next });
            }
        }
    },
});
