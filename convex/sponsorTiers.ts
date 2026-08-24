import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { validateMaxLength } from "./lib/validation";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("sponsorTiers").withIndex("by_order").collect();
    },
});

export const upsert = mutation({
    args: {
        id: v.optional(v.id("sponsorTiers")),
        name: v.string(),
        price: v.string(),
        benefits: v.array(v.string()),
        order: v.number(),
        color: v.optional(v.string()),
        textColor: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        validateMaxLength(args.name, "name", 100);
        const { id, ...data } = args;
        if (id) {
            await ctx.db.patch(id, data);
        } else {
            // Check for existing tier with same name to prevent duplicates
            // TODO: add index by_name on sponsorTiers for this query
            const existing = await ctx.db
                .query("sponsorTiers")
                .filter((q) => q.eq(q.field("name"), args.name))
                .first();
            if (existing) {
                await ctx.db.patch(existing._id, data);
            } else {
                await ctx.db.insert("sponsorTiers", data);
            }
        }
    },
});

export const remove = mutation({
    args: { id: v.id("sponsorTiers") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const tier = await ctx.db.get(args.id);
        if (tier) {
            // Use by_tier index on sponsors to check dependents
            const dependents = await ctx.db
                .query("sponsors")
                .withIndex("by_tier", (q) => q.eq("tier", tier.name))
                .collect();
            if (dependents.length > 0) {
                throw new Error(`Não é possível apagar: ${dependents.length} parceiro(s) usam este nível.`);
            }
        }
        await ctx.db.delete(args.id);
    },
});
