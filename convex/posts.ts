import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, isAdmin } from "./lib/auth";
import { internal } from "./_generated/api";
import { cleanupStorageOnDelete, cleanupStorageOnUpdate } from "./lib/cascade";
import { assertCategoryExists, assertUniqueSlug, validateMaxLength, validateRequired, sanitizeContentServer } from "./lib/validation";

export const list = query({
    args: {
        categoryId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        let posts;

        if (args.categoryId) {
            // Use by_category index which includes date for ordering
            posts = await ctx.db
                .query("posts")
                .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
                .order("desc")
                .take(200);
        } else {
            posts = await ctx.db
                .query("posts")
                .withIndex("by_date")
                .order("desc")
                .take(200);
        }

        // Filter published at JS level since no dedicated published index exists
        // TODO: add index by_published or by_status for DB-level filtering
        const published = posts.filter(p => p.published === true);

        return Promise.all(
            published.map(async (post) => ({
                ...post,
                coverImageUrl: post.coverImage ? await ctx.storage.getUrl(post.coverImage) : post.externalImage,
            }))
        );
    },
});

export const listSummary = query({
    args: { categoryId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let posts;

        if (args.categoryId) {
            posts = await ctx.db
                .query("posts")
                .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
                .order("desc")
                .take(200);
        } else {
            posts = await ctx.db
                .query("posts")
                .withIndex("by_date")
                .order("desc")
                .take(200);
        }

        const published = posts.filter(p => p.published === true);

        return Promise.all(
            published.map(async (post) => {
                const { content: _content, ...rest } = post;
                return {
                    ...rest,
                    coverImageUrl: post.coverImage ? await ctx.storage.getUrl(post.coverImage) : post.externalImage,
                };
            })
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

        const posts = await ctx.db
            .query("posts")
            .withIndex("by_date")
            .order("desc")
            .take(500);

        return Promise.all(
            posts.map(async (post) => ({
                ...post,
                coverImageUrl: post.coverImage ? await ctx.storage.getUrl(post.coverImage) : post.externalImage,
            }))
        );
    },
});

// Full post fetched on demand by the article page; the site-wide list
// subscription only carries summaries
export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const post = await ctx.db
            .query("posts")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
        if (!post) return null;
        if (!post.published) {
            const admin = await isAdmin(ctx).catch(() => false);
            if (!admin) return null;
        }
        return {
            ...post,
            coverImageUrl: post.coverImage ? await ctx.storage.getUrl(post.coverImage) : post.externalImage,
        };
    },
});

export const getById = query({
    args: { id: v.id("posts") },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id);
        if (!post) return null;

        // Protect unpublished content from non-admin users
        if (post.published !== true) {
            try {
                const admin = await isAdmin(ctx);
                if (!admin) return null;
            } catch {
                return null;
            }
        }

        return {
            ...post,
            coverImageUrl: post.coverImage ? await ctx.storage.getUrl(post.coverImage) : post.externalImage,
        };
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        excerpt: v.string(),
        content: v.string(),
        author: v.string(),
        authorRole: v.optional(v.string()),
        authorAvatar: v.optional(v.string()),
        date: v.string(),
        readTime: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        categoryId: v.string(),
        slug: v.string(),
        coverImage: v.optional(v.id("_storage")),
        externalImage: v.optional(v.string()),
        published: v.boolean(),
    },
    handler: async (ctx, args) => {
        const { userId } = await requireAdmin(ctx);
        validateRequired(args, ["title", "excerpt", "content", "author"]);
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "content:create",
            userId,
        });
        validateMaxLength(args.title, "título", 200);
        validateMaxLength(args.content, "conteúdo", 100000);

        if (args.categoryId) {
            await assertCategoryExists(ctx, args.categoryId);
        }

        // Sanitize HTML content (defense-in-depth)
        const sanitizedContent = sanitizeContentServer(args.content);

        // Ensure slug uniqueness
        await assertUniqueSlug(ctx, "posts", args.slug);

        return await ctx.db.insert("posts", { ...args, content: sanitizedContent });
    },
});

export const update = mutation({
    args: {
        id: v.id("posts"),
        title: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        content: v.optional(v.string()),
        author: v.optional(v.string()),
        authorRole: v.optional(v.string()),
        authorAvatar: v.optional(v.string()),
        date: v.optional(v.string()),
        readTime: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        categoryId: v.optional(v.string()),
        slug: v.optional(v.string()),
        coverImage: v.optional(v.id("_storage")),
        externalImage: v.optional(v.string()),
        published: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { userId } = await requireAdmin(ctx);
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "content:update",
            userId,
        });
        if (args.slug) {
            await assertUniqueSlug(ctx, "posts", args.slug, args.id);
        }
        const { id, ...updates } = args;
        // Sanitize HTML content if provided (defense-in-depth)
        if (updates.content !== undefined) {
            updates.content = sanitizeContentServer(updates.content);
        }
        if (updates.coverImage !== undefined) {
            const existing = await ctx.db.get(id);
            if (existing) {
                await cleanupStorageOnUpdate(ctx, existing, updates.coverImage, "coverImage");
            }
        }
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("posts") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const doc = await ctx.db.get(args.id);
        if (doc) {
            await cleanupStorageOnDelete(ctx, doc, ["coverImage"]);
            await ctx.db.delete(args.id);
        }
    },
});

export const clearStorageImage = mutation({
    args: { id: v.id("posts") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const post = await ctx.db.get(args.id);
        if (post && post.coverImage) {
            try { await ctx.storage.delete(post.coverImage); } catch (e) { console.error("Failed to delete storage:", e); }
            const { coverImage, ...rest } = post;
            await ctx.db.replace(args.id, rest);
        }
    },
});
