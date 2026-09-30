import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { cleanupStorageOnDelete, reconcileImageUpdate } from "./lib/cascade";
import { validateMaxLength } from "./lib/validation";
import { retainUrl } from "./lib/uploads";

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
        const existing = await ctx.db
            .query("actionAreas")
            .withIndex("by_title", (q) => q.eq("title", args.title))
            .first();
        if (existing) throw new ConvexError("Já existe uma área de atuação com este título.");

        await retainUrl(ctx, args.externalImage);
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
        await reconcileImageUpdate(ctx, await ctx.db.get(id), updates, "image", "externalImage");
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("actionAreas") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const doc = await ctx.db.get(args.id);
        if (doc) {
            await cleanupStorageOnDelete(ctx, doc, ["image"], ["externalImage"]);
            await ctx.db.delete(args.id);
        }
    },
});
