import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, isAdmin as checkIsAdmin } from "./lib/auth";
import { validateMaxLength } from "./lib/validation";

export const list = query({
    args: {},
    handler: async (ctx) => {
        if (!(await checkIsAdmin(ctx))) return [];
        return await ctx.db
            .query("activityLogs")
            .withIndex("by_timestamp")
            .order("desc")
            .take(50);
    },
});

export const create = mutation({
    args: {
        action: v.string(),
        target: v.string(),
        description: v.string(),
        user: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { user: userDoc } = await requireAdmin(ctx);
        validateMaxLength(args.action, "action", 200);
        validateMaxLength(args.target, "target", 200);
        validateMaxLength(args.description, "description", 1000);

        const userInfo = userDoc as unknown as { email?: string; name?: string };
        const userName = userInfo.email ?? userInfo.name ?? "Utilizador";

        return await ctx.db.insert("activityLogs", {
            action: args.action,
            target: args.target,
            description: args.description,
            user: userName,
            timestamp: Date.now(),
        });
    },
});
