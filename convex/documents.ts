import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { cleanupStorageOnDelete } from "./lib/cascade";
import { validateMaxLength } from "./lib/validation";

export const list = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const docs = args.category
            ? await ctx.db
                .query("documents")
                .withIndex("by_category", (q) => q.eq("category", args.category))
                .collect()
            : await ctx.db.query("documents").collect();

        return Promise.all(
            docs.map(async (doc) => ({
                ...doc,
                url: doc.externalUrl || (doc.fileId ? await ctx.storage.getUrl(doc.fileId) : ""),
            }))
        );
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        fileId: v.optional(v.id("_storage")),
        externalUrl: v.optional(v.string()),
        category: v.string(),
        date: v.optional(v.string()),
        size: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        validateMaxLength(args.title, "title", 200);
        if (args.description) validateMaxLength(args.description, "description", 2000);
        validateMaxLength(args.category, "category", 100);
        return await ctx.db.insert("documents", {
            ...args,
            uploadedAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("documents"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        date: v.optional(v.string()),
        size: v.optional(v.string()),
        externalUrl: v.optional(v.string()),
        fileId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.title) validateMaxLength(args.title, "title", 200);
        if (args.description) validateMaxLength(args.description, "description", 2000);
        if (args.category) validateMaxLength(args.category, "category", 100);
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const doc = await ctx.db.get(args.id);
        if (doc) {
            await cleanupStorageOnDelete(ctx, doc, ["fileId"]);
            await ctx.db.delete(args.id);
        }
    },
});
