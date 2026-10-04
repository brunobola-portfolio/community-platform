import { query } from "./_generated/server";
import { isAdmin } from "./lib/auth";
import { DEFAULT_IMAGE_MODEL, DEFAULT_OPENROUTER_IMAGE_MODEL } from "./lib/aiDefaults";

/**
 * Which image engines this deployment can actually use, for the AI studio and
 * the MediaStudio selectors. The keys live in the deployment env and in the
 * write-only settings fields, so the browser cannot tell on its own; only
 * presence flags leave the server, never the keys.
 */
export const capabilities = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx).catch(() => false))) return null;
    const doc = await ctx.db.query("settings").first();
    const gemini = Boolean(process.env.GEMINI_API_KEY);
    const openrouter = Boolean(doc?.openrouterApiKey || process.env.OPENROUTER_API_KEY);
    // Same rule as preferredImageEngine: NanoBanana unless only OpenRouter has a key
    const preferred = doc?.imageProvider ?? (gemini ? "gemini" : openrouter ? "openrouter" : "gemini");
    return {
      gemini,
      openrouter,
      defaultEngine: preferred === "openrouter" && openrouter ? "openrouter" as const : gemini ? "gemini" as const : openrouter ? "openrouter" as const : null,
      geminiImageModel: doc?.imageModel || DEFAULT_IMAGE_MODEL,
      openrouterImageModel: doc?.openrouterImageModel || DEFAULT_OPENROUTER_IMAGE_MODEL,
      preferred,
    };
  },
});
