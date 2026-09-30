import { internalMutation, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { registerUpload } from "./lib/uploads";

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

// Only files uploaded moments ago may be registered: with refs 0 an old file that
// records already use would be swept as abandoned
const FRESH_UPLOAD_MS = 15 * 60 * 1000;

// Resolve a freshly uploaded file to its public serving URL so admin forms
// can persist a plain string in the external* fields. The ledger remembers
// which file the URL is, so the file can go once no record uses it
export const getUrl = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const meta = await ctx.db.system.get(args.storageId);
        if (!meta) return null;
        if (Date.now() - meta._creationTime > FRESH_UPLOAD_MS) {
            throw new ConvexError("Este ficheiro já não é um carregamento recente. Carregue-o de novo.");
        }
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
