import { v, ConvexError } from "convex/values";
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
            const existing = await ctx.db
                .query("sponsorTiers")
                .withIndex("by_name", (q) => q.eq("name", args.name))
                .first();
            if (existing) throw new ConvexError("Já existe um nível com este nome.");
            await ctx.db.insert("sponsorTiers", data);
        }
    },
});

export const remove = mutation({
    args: { id: v.id("sponsorTiers") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const tier = await ctx.db.get(args.id);
        if (tier) {
            // Sponsors store the tier id; rows seeded before that hold the name
            const [byId, byName] = await Promise.all([
                ctx.db.query("sponsors").withIndex("by_tier", (q) => q.eq("tier", String(tier._id))).collect(),
                ctx.db.query("sponsors").withIndex("by_tier", (q) => q.eq("tier", tier.name)).collect(),
            ]);
            const dependents = [...byId, ...byName];
            if (dependents.length > 0) {
                throw new ConvexError(`Não é possível apagar: ${dependents.length} parceiro(s) usam este nível.`);
            }
        }
        await ctx.db.delete(args.id);
    },
});
