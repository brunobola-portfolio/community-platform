import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { validateMaxLength } from "./lib/validation";

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("stats").withIndex("by_order").collect();
    },
});

export const upsert = mutation({
    args: {
        id: v.optional(v.id("stats")),
        label: v.string(),
        value: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        validateMaxLength(args.label, "label", 100);
        validateMaxLength(args.value, "value", 100);
        const { id, ...data } = args;
        if (id) {
            await ctx.db.patch(id, data);
        } else {
            // TODO: use by_label index once added to schema
            const existing = await ctx.db
                .query("stats")
                .filter((q) => q.eq(q.field("label"), args.label))
                .first();
            if (existing) return existing._id;

            await ctx.db.insert("stats", data);
        }
    },
});

export const remove = mutation({
    args: { id: v.id("stats") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.delete(args.id);
    },
});
