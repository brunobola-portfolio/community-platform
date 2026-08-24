import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

// Resolve a freshly uploaded file to its public serving URL so admin forms
// can persist a plain string in the external* fields
export const getUrl = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        return await ctx.storage.getUrl(args.storageId);
    },
});
