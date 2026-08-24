import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { validateMaxLength } from "./lib/validation";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("categories").collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        type: v.string(),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        validateMaxLength(args.name, "name", 100);
        validateMaxLength(args.slug, "slug", 100);
        const existing = await ctx.db
            .query("categories")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert("categories", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("categories"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        type: v.optional(v.string()),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.name) validateMaxLength(args.name, "name", 100);
        if (args.slug) validateMaxLength(args.slug, "slug", 100);
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("categories")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const remove = mutation({
    args: { id: v.id("categories") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const category = await ctx.db.get(args.id);
        if (!category) return;

        const categoryIdStr = String(args.id);

        // Referential check using by_category index on posts
        const posts = await ctx.db
            .query("posts")
            .withIndex("by_category", (q) => q.eq("categoryId", categoryIdStr))
            .collect();

        // TODO: use events.by_category index once added to schema
        const events = await ctx.db
            .query("events")
            .filter((q) => q.eq(q.field("categoryId"), categoryIdStr))
            .collect();

        if (posts.length > 0 || events.length > 0) {
            throw new ConvexError("Categoria em uso. Remova primeiro os conteúdos associados.");
        }

        await ctx.db.delete(args.id);
    },
});

export const cleanupDuplicates = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        const all = await ctx.db.query("categories").collect();
        const seen = new Map<string, string>(); // name -> id
        const deleted: string[] = [];

        for (const cat of all) {
            if (seen.has(cat.name)) {
                const masterId = seen.get(cat.name)!;
                const catIdStr = String(cat._id);

                // Re-assign posts using by_category index
                const posts = await ctx.db
                    .query("posts")
                    .withIndex("by_category", (q) => q.eq("categoryId", catIdStr))
                    .collect();
                for (const p of posts) {
                    await ctx.db.patch(p._id, { categoryId: masterId });
                }

                // TODO: use events.by_category index once added to schema
                const events = await ctx.db
                    .query("events")
                    .filter((q) => q.eq(q.field("categoryId"), catIdStr))
                    .collect();
                for (const e of events) {
                    await ctx.db.patch(e._id, { categoryId: masterId });
                }

                await ctx.db.delete(cat._id);
                deleted.push(cat.name);
            } else {
                seen.set(cat.name, String(cat._id));
            }
        }
        return { success: true, deleted };
    }
});
