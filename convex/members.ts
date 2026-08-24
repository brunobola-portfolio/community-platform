import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { internal } from "./_generated/api";
import { cleanupStorageOnDelete, cleanupStorageOnUpdate } from "./lib/cascade";
import { validateRequired, validateMaxLength, sanitizeContentServer } from "./lib/validation";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const members = await ctx.db.query("members").collect();

        const groupPriority: Record<string, number> = {
            "Direção": 1,
            "Assembleia Geral": 2,
            "Conselho Fiscal": 3,
            "founder": 4
        };

        members.sort((a, b) => {
            const pA = groupPriority[a.group] ?? 99;
            const pB = groupPriority[b.group] ?? 99;
            if (pA !== pB) return pA - pB;
            return a.order - b.order;
        });

        return Promise.all(
            members.map(async (m) => ({
                ...m,
                photoUrl: m.photo ? await ctx.storage.getUrl(m.photo) : m.externalPhoto,
            }))
        );
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        role: v.string(),
        bio: v.optional(v.string()),
        photo: v.optional(v.id("_storage")),
        externalPhoto: v.optional(v.string()),
        group: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        const { userId } = await requireAdmin(ctx);
        validateRequired(args, ["name", "role"]);
        validateMaxLength(args.name, "name", 200);
        validateMaxLength(args.role, "role", 200);
        if (args.bio) {
            validateMaxLength(args.bio, "bio", 2000);
            args = { ...args, bio: sanitizeContentServer(args.bio) };
        }
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "content:create",
            userId,
        });
        const VALID_GROUPS = ["Direção", "Assembleia Geral", "Conselho Fiscal", "founder"];
        if (!VALID_GROUPS.includes(args.group)) {
            throw new Error(`Grupo inválido: "${args.group}". Grupos permitidos: ${VALID_GROUPS.join(", ")}`);
        }
        return await ctx.db.insert("members", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("members"),
        name: v.optional(v.string()),
        role: v.optional(v.string()),
        bio: v.optional(v.string()),
        photo: v.optional(v.id("_storage")),
        externalPhoto: v.optional(v.string()),
        group: v.optional(v.string()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { userId } = await requireAdmin(ctx);
        if (args.name) validateMaxLength(args.name, "name", 200);
        if (args.role) validateMaxLength(args.role, "role", 200);
        if (args.bio !== undefined) {
            validateMaxLength(args.bio, "bio", 2000);
            args = { ...args, bio: sanitizeContentServer(args.bio) };
        }
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
            key: "content:update",
            userId,
        });
        if (args.group) {
            const VALID_GROUPS = ["Direção", "Assembleia Geral", "Conselho Fiscal", "founder"];
            if (!VALID_GROUPS.includes(args.group)) {
                throw new Error(`Grupo inválido: "${args.group}". Grupos permitidos: ${VALID_GROUPS.join(", ")}`);
            }
        }
        const { id, ...updates } = args;
        if (updates.photo !== undefined) {
            const existing = await ctx.db.get(id);
            if (existing) {
                await cleanupStorageOnUpdate(ctx, existing, updates.photo, "photo");
            }
        }
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("members") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const doc = await ctx.db.get(args.id);
        if (doc) {
            await cleanupStorageOnDelete(ctx, doc, ["photo"]);
            await ctx.db.delete(args.id);
        }
    },
});

export const clearStorageImage = mutation({
    args: { id: v.id("members") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const member = await ctx.db.get(args.id);
        if (member && member.photo) {
            try { await ctx.storage.delete(member.photo); } catch (e) { console.error("Failed to delete storage:", e); }
            const { photo, ...rest } = member;
            await ctx.db.replace(args.id, rest);
        }
    },
});

export const clearAll = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        const members = await ctx.db.query("members").collect();
        for (const member of members) {
            await ctx.db.delete(member._id);
        }
    },
});
