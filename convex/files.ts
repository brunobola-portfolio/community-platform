import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { registerUpload } from "./lib/uploads";

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

// Resolve a freshly uploaded file to its public serving URL so admin forms
// can persist a plain string in the external* fields. The ledger remembers
// which file the URL is, so the file can go once no record uses it
export const getUrl = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const url = await ctx.storage.getUrl(args.storageId);
        if (url) await registerUpload(ctx, args.storageId, url);
        return url;
    },
});

// Same ledger entry for images the AI generates straight into storage
export const registerGenerated = internalMutation({
    args: { storageId: v.id("_storage"), url: v.string() },
    handler: async (ctx, args) => {
        await registerUpload(ctx, args.storageId, args.url);
    },
});
