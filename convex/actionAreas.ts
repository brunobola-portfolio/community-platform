import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { cleanupStorageOnDelete, cleanupStorageOnUpdate } from "./lib/cascade";
import { validateMaxLength } from "./lib/validation";

export const list = query({
    handler: async (ctx) => {
        const areas = await ctx.db.query("actionAreas").withIndex("by_order").collect();
        return Promise.all(
            areas.map(async (a) => ({
                ...a,
                imageUrl: a.image ? await ctx.storage.getUrl(a.image) : a.externalImage,
            }))
        );
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        subtitle: v.string(),
        description: v.string(),
        longDescription: v.string(),
        features: v.array(v.string()),
        externalImage: v.optional(v.string()),
        image: v.optional(v.id("_storage")),
        iconName: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        validateMaxLength(args.title, "title", 200);
        validateMaxLength(args.subtitle, "subtitle", 200);
        validateMaxLength(args.description, "description", 2000);
        validateMaxLength(args.longDescription, "longDescription", 5000);
        // Check for existing area with same title
        // TODO: add index by_title on actionAreas for this query
        const existing = await ctx.db
            .query("actionAreas")
            .filter((q) => q.eq(q.field("title"), args.title))
            .first();
        if (existing) return existing._id;

        return await ctx.db.insert("actionAreas", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("actionAreas"),
        title: v.optional(v.string()),
        subtitle: v.optional(v.string()),
        description: v.optional(v.string()),
        longDescription: v.optional(v.string()),
        features: v.optional(v.array(v.string())),
        externalImage: v.optional(v.string()),
        image: v.optional(v.id("_storage")),
        iconName: v.optional(v.string()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.title) validateMaxLength(args.title, "title", 200);
        if (args.subtitle) validateMaxLength(args.subtitle, "subtitle", 200);
        if (args.description) validateMaxLength(args.description, "description", 2000);
        if (args.longDescription) validateMaxLength(args.longDescription, "longDescription", 5000);
        const { id, ...updates } = args;
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
    args: { id: v.id("actionAreas") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const doc = await ctx.db.get(args.id);
        if (doc) {
            await cleanupStorageOnDelete(ctx, doc, ["image"]);
            await ctx.db.delete(args.id);
        }
    },
});
