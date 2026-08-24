import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, isAdmin } from "./lib/auth";
import { internal } from "./_generated/api";
import { cascadeDeleteEvent, cleanupStorageOnUpdate } from "./lib/cascade";
import { assertCategoryExists, assertUniqueSlug, validateMaxLength, validateRequired, sanitizeContentServer } from "./lib/validation";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const published = await ctx.db
            .query("events")
            .withIndex("by_status", (q) => q.eq("status", "published"))
            .order("desc")
            .take(200);

        return Promise.all(
            published.map(async (event) => ({
                ...event,
                imageUrl: event.image ? await ctx.storage.getUrl(event.image) : event.externalImage,
            }))
        );
    },
});

// Admin listing including drafts. Returns null for non-admins so the
// reactive client can fall back to the public list without errors.
export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const admin = await isAdmin(ctx).catch(() => false);
        if (!admin) return null;

        const all = await ctx.db
            .query("events")
            .withIndex("by_date")
            .order("desc")
            .take(500);

        return Promise.all(
            all.map(async (event) => ({
                ...event,
                imageUrl: event.image ? await ctx.storage.getUrl(event.image) : event.externalImage,
            }))
        );
    },
});

export const getById = query({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        const event = await ctx.db.get(args.id);
        if (!event) return null;

        // Protect unpublished content from non-admin users
        if (event.status !== "published") {
            try {
                const admin = await isAdmin(ctx);
                if (!admin) return null;
            } catch {
                return null;
            }
        }

        return {
            ...event,
            imageUrl: event.image ? await ctx.storage.getUrl(event.image) : event.externalImage,
        };
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        date: v.string(),
        location: v.string(),
        categoryId: v.string(),
        slug: v.string(),
        image: v.optional(v.id("_storage")), // Uploaded file
        externalImage: v.optional(v.string()), // OR external URL
        status: v.union(v.literal("published"), v.literal("draft")),
        isHighlight: v.optional(v.boolean()),
        isTournament: v.optional(v.boolean()),
        tournamentType: v.optional(v.string()),
        entryPrice: v.optional(v.number()),
        maxParticipants: v.optional(v.number()),
        currentParticipants: v.optional(v.number()),
        registrationOpen: v.optional(v.boolean()),
        registrationFields: v.optional(v.array(v.object({
            id: v.string(),
            label: v.string(),
            type: v.string(),
            required: v.boolean(),
            placeholder: v.optional(v.string()),
        }))),
    },
    handler: async (ctx, args) => {
        const { userId } = await requireAdmin(ctx);
        validateRequired(args, ["title", "description", "location", "date"]);
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "content:create",
            userId,
        });
        await assertUniqueSlug(ctx, "events", args.slug);
        validateMaxLength(args.title, "título", 200);
        validateMaxLength(args.description, "descrição", 10000);

        if (args.categoryId) {
            await assertCategoryExists(ctx, args.categoryId);
        }

        // Sanitize HTML description (defense-in-depth)
        const sanitizedDescription = sanitizeContentServer(args.description);

        const eventId = await ctx.db.insert("events", { ...args, description: sanitizedDescription });
        return eventId;
    },
});

export const update = mutation({
    args: {
        id: v.id("events"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        date: v.optional(v.string()),
        location: v.optional(v.string()),
        categoryId: v.optional(v.string()),
        slug: v.optional(v.string()),
        image: v.optional(v.id("_storage")),
        externalImage: v.optional(v.string()),
        status: v.optional(v.union(v.literal("published"), v.literal("draft"))),
        isHighlight: v.optional(v.boolean()),
        isTournament: v.optional(v.boolean()),
        tournamentType: v.optional(v.string()),
        entryPrice: v.optional(v.number()),
        maxParticipants: v.optional(v.number()),
        currentParticipants: v.optional(v.number()),
        registrationOpen: v.optional(v.boolean()),
        registrationFields: v.optional(v.array(v.object({
            id: v.string(),
            label: v.string(),
            type: v.string(),
            required: v.boolean(),
            placeholder: v.optional(v.string()),
        }))),
    },
    handler: async (ctx, args) => {
        const { userId } = await requireAdmin(ctx);
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "content:update",
            userId,
        });
        if (args.slug) {
            await assertUniqueSlug(ctx, "events", args.slug, args.id);
        }
        const { id, ...updates } = args;
        // Sanitize HTML description if provided (defense-in-depth)
        if (updates.description !== undefined) {
            updates.description = sanitizeContentServer(updates.description);
        }
        // Clean up old storage if image is being replaced
        if (updates.image !== undefined) {
            const existing = await ctx.db.get(id);
            if (existing) {
                await cleanupStorageOnUpdate(ctx, existing, updates.image, "image");
            }
        }
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await cascadeDeleteEvent(ctx, args.id);
    },
});

export const getParticipantCount = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();
        return registrations.filter((r) => r.status !== "cancelled").length;
    },
});

export const clearStorageImage = mutation({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const event = await ctx.db.get(args.id);
        if (event && event.image) {
            try { await ctx.storage.delete(event.image); } catch (e) { console.error("Failed to delete storage:", e); }
            const { image, ...rest } = event;
            await ctx.db.replace(args.id, rest);
        }
    },
});
