import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAdmin, requireAuth, getCurrentUser } from "./lib/auth";
import { validateMaxLength, sanitizeContentServer } from "./lib/validation";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        const userWithRole = user as unknown as { role?: string };
        const isAdmin = user && userWithRole.role === "admin";

        const all = await ctx.db
            .query("notifications")
            .withIndex("by_timestamp")
            .order("desc")
            .collect();

        let filtered;
        if (isAdmin) filtered = all;
        else if (user) filtered = all.filter(n => n.target === "all" || n.target === "user");
        else filtered = all.filter(n => n.target === "all");

        // Get read status for current user
        const userId = user?._id;
        if (!userId) {
            return filtered.map(n => ({ ...n, read: false }));
        }

        const typedUserId = userId as Id<"users">;

        const userReads = await ctx.db
            .query("notificationReads")
            .withIndex("by_user", (q) => q.eq("userId", typedUserId))
            .collect();

        const readSet = new Set(userReads.map(r => String(r.notificationId)));

        return filtered.map(n => ({
            ...n,
            read: readSet.has(String(n._id)),
        }));
    },
});

export const markRead = mutation({
    args: { id: v.id("notifications") },
    handler: async (ctx, args) => {
        const { userId } = await requireAuth(ctx);
        const typedUserId = userId as unknown as Id<"users">;

        const notification = await ctx.db.get(args.id);
        if (!notification) {
            throw new Error("Notificação não encontrada.");
        }

        // Permission check
        const user = await ctx.db.get(typedUserId);
        const userWithRole = user as unknown as { role?: string };
        const isAdminUser = user && userWithRole.role === "admin";

        if (!isAdminUser) {
            if (notification.target !== "all" && notification.target !== "user") {
                throw new Error("Sem permissão para esta notificação.");
            }
        }

        // Check if already read by this user
        const existingRead = await ctx.db
            .query("notificationReads")
            .withIndex("by_notification_user", (q) =>
                q.eq("notificationId", args.id).eq("userId", typedUserId)
            )
            .first();

        if (!existingRead) {
            await ctx.db.insert("notificationReads", {
                notificationId: args.id,
                userId: typedUserId,
                readAt: Date.now(),
            });
        }
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        message: v.string(),
        type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("urgent")),
        target: v.union(v.literal("all"), v.literal("admin"), v.literal("user")),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        validateMaxLength(args.title, "title", 200);
        validateMaxLength(args.message, "message", 2000);
        const sanitizedMessage = sanitizeContentServer(args.message);
        return await ctx.db.insert("notifications", {
            ...args,
            message: sanitizedMessage,
            read: false,
            timestamp: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("notifications"),
        title: v.optional(v.string()),
        message: v.optional(v.string()),
        type: v.optional(v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("urgent"))),
        target: v.optional(v.union(v.literal("all"), v.literal("admin"), v.literal("user"))),
        read: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("notifications") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        // Cascade delete associated read records
        const reads = await ctx.db
            .query("notificationReads")
            .withIndex("by_notification_user", (q) => q.eq("notificationId", args.id))
            .collect();
        for (const read of reads) {
            await ctx.db.delete(read._id);
        }
        await ctx.db.delete(args.id);
    },
});
