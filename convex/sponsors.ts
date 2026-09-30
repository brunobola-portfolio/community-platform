import { query, mutation, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireAdmin, isAdmin } from "./lib/auth";
import { internal } from "./_generated/api";
import { cleanupStorageOnDelete, reconcileImageUpdate } from "./lib/cascade";
import { validateRequired, validateMaxLength } from "./lib/validation";
import { retainUrl } from "./lib/uploads";

async function withLogoUrls(ctx: QueryCtx, sponsors: Doc<"sponsors">[]) {
    return Promise.all(
        sponsors.map(async (s) => ({
            ...s,
            logoUrl: s.logo ? await ctx.storage.getUrl(s.logo) : s.externalLogo,
        }))
    );
}

// Public: only partners marked active; an inactive one must not show on the home page
export const list = query({
    args: {},
    handler: async (ctx) => {
        const sponsors = await ctx.db
            .query("sponsors")
            .withIndex("by_active", (q) => q.eq("active", true))
            .take(500);
        return withLogoUrls(ctx, sponsors);
    },
});

// Backoffice: every partner, active or not; empty for non-admins instead of throwing
export const listAll = query({
    args: {},
    handler: async (ctx) => {
        if (!(await isAdmin(ctx))) return [];
        return withLogoUrls(ctx, await ctx.db.query("sponsors").take(500));
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        tier: v.string(),
        logo: v.optional(v.id("_storage")),
        externalLogo: v.optional(v.string()),
        website: v.optional(v.string()),
        active: v.boolean(),
    },
    handler: async (ctx, args) => {
        const { userId } = await requireAdmin(ctx);
        validateRequired(args, ["name", "tier"]);
        validateMaxLength(args.name, "name", 200);
        if (args.website) validateMaxLength(args.website, "website", 500);
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "content:create",
            userId,
        });
        await retainUrl(ctx, args.externalLogo);
        return await ctx.db.insert("sponsors", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("sponsors"),
        name: v.optional(v.string()),
        tier: v.optional(v.string()),
        logo: v.optional(v.id("_storage")),
        externalLogo: v.optional(v.string()),
        website: v.optional(v.string()),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { userId } = await requireAdmin(ctx);
        if (args.name) validateMaxLength(args.name, "name", 200);
        if (args.website) validateMaxLength(args.website, "website", 500);
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "content:update",
            userId,
        });
        const { id, ...updates } = args;
        await reconcileImageUpdate(ctx, await ctx.db.get(id), updates, "logo", "externalLogo");
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("sponsors") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const doc = await ctx.db.get(args.id);
        if (doc) {
            await cleanupStorageOnDelete(ctx, doc, ["logo"], ["externalLogo"]);
            await ctx.db.delete(args.id);
        }
    },
});
