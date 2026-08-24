import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { cleanupStorageOnDelete, cleanupStorageOnUpdate } from "./lib/cascade";
import { validateMaxLength, validateRequired } from "./lib/validation";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const milestones = await ctx.db
            .query("milestones")
            .withIndex("by_order")
            .order("asc")
            .collect();

        return Promise.all(
            milestones.map(async (m) => ({
                ...m,
                imageUrl: m.image ? await ctx.storage.getUrl(m.image) : m.externalImage,
            }))
        );
    },
});

export const create = mutation({
    args: {
        year: v.number(),
        title: v.string(),
        description: v.string(),
        image: v.optional(v.id("_storage")),
        externalImage: v.optional(v.string()),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        validateRequired(args, ["title", "description"]);
        validateMaxLength(args.title, "título", 200);
        validateMaxLength(args.description, "descrição", 2000);
        return await ctx.db.insert("milestones", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("milestones"),
        year: v.optional(v.number()),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        image: v.optional(v.id("_storage")),
        externalImage: v.optional(v.string()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.title !== undefined) validateMaxLength(args.title, "título", 200);
        if (args.description !== undefined) validateMaxLength(args.description, "descrição", 2000);
        const { id, ...updates } = args;
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
    args: { id: v.id("milestones") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const milestone = await ctx.db.get(args.id);
        if (milestone) {
            await cleanupStorageOnDelete(ctx, milestone, ["image"]);
        }
        await ctx.db.delete(args.id);
    },
});
