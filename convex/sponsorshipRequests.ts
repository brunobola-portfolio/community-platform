import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAdmin, isAdmin } from "./lib/auth";
import { internal } from "./_generated/api";
import { validateEmail, validateMaxLength, validateRequired } from "./lib/validation";

export const list = query({
    args: {},
    handler: async (ctx) => {
        if (!(await isAdmin(ctx))) return [];
        return await ctx.db
            .query("sponsorshipRequests")
            .withIndex("by_timestamp")
            .order("desc")
            .collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        tier: v.string(),
    },
    handler: async (ctx, args) => {
        // Public mutation - no auth required, but validate inputs.
        // Rate limit keyed per submitted email so one spammer cannot exhaust
        // the shared anonymous bucket for every visitor
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "sponsorship:create",
            userId: args.email.trim().toLowerCase() || "anonymous",
        });
        validateRequired(args, ["name", "email", "phone", "tier"]);
        validateMaxLength(args.phone, "telefone", 20);
        validateMaxLength(args.email, "email", 254);

        if (!validateEmail(args.email)) {
            throw new ConvexError("Formato de email inválido.");
        }

        validateMaxLength(args.name, "nome", 200);

        return await ctx.db.insert("sponsorshipRequests", {
            ...args,
            timestamp: Date.now(),
            status: "pending",
        });
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("sponsorshipRequests"),
        status: v.union(v.literal("pending"), v.literal("contacted"), v.literal("confirmed"), v.literal("rejected")),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.patch(args.id, { status: args.status });
    },
});

export const remove = mutation({
    args: { id: v.id("sponsorshipRequests") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.delete(args.id);
    },
});
