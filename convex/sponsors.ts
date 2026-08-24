import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { internal } from "./_generated/api";
import { cleanupStorageOnDelete, cleanupStorageOnUpdate } from "./lib/cascade";
import { validateRequired, validateMaxLength } from "./lib/validation";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const sponsors = await ctx.db.query("sponsors").collect();

        return Promise.all(
            sponsors.map(async (s) => ({
                ...s,
                logoUrl: s.logo ? await ctx.storage.getUrl(s.logo) : s.externalLogo,
            }))
        );
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
        if (updates.logo !== undefined) {
            const existing = await ctx.db.get(id);
            if (existing) {
                await cleanupStorageOnUpdate(ctx, existing, updates.logo, "logo");
            }
        }
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("sponsors") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const doc = await ctx.db.get(args.id);
        if (doc) {
            await cleanupStorageOnDelete(ctx, doc, ["logo"]);
            await ctx.db.delete(args.id);
        }
    },
});
