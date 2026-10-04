"use node";

import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { Modality } from "@google/genai";
import { api, internal } from "./_generated/api";
import { DEFAULT_TTS_MODEL } from "./lib/aiDefaults";
import { getAI, classifyProviderError, consumePublicBudget, logAiUsage, AI_FEATURE } from "./lib/aiShared";
import { geminiCost } from "./lib/aiCost";
import { generateWithFallback, loadReference, storeGeneratedImage } from "./lib/aiImage";

/**
 * Media actions: text-to-speech (Gemini) and image generation (Gemini or OpenRouter).
 */
// ---------------------------------------------------------------------------
// Action 2: tts
// Text-to-Speech via Gemini TTS model
// ---------------------------------------------------------------------------
export const tts = action({
  args: {
    text: v.string(),
    voiceName: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    let ttsModel = DEFAULT_TTS_MODEL;
    let logUserId = "unknown";
    try {
      // Public TTS: optional auth, shared rate-limit bucket for anonymous use
      const userId = await ctx.runQuery(api.lib.actionAuth.getOptionalAuth);
      await consumePublicBudget(ctx, "ai:tts", userId as string | null, args.sessionId);
      logUserId = (userId as string | null) ?? "anonymous";
      const aiSettings = await ctx.runQuery(internal.settings.getForAI);
      if (aiSettings?.enableChatbot === false) throw new ConvexError("ERR_UNAVAILABLE");

      const ai = getAI();

      // TTS model from DB settings, env vars, or default
      const settings = await ctx.runQuery(api.settings.getPublic);
      ttsModel = settings?.ttsModel ?? process.env.GEMINI_TTS_MODEL ?? DEFAULT_TTS_MODEL;

      // Read-aloud of a chat reply never needs more than this
      const safeText = args.text.slice(0, 1500);
      const voiceName = args.voiceName ?? "Kore";

      const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [
          {
            parts: [
              {
                text: `Diz isto de forma amigavel e profissional: ${safeText}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("Nenhum áudio recebido do modelo TTS.");
      }

      await logAiUsage(ctx, { userId: logUserId, action: "tts", feature: AI_FEATURE.voice, model: ttsModel, startedAt: startTime, costUsd: geminiCost(ttsModel, response.usageMetadata) });

      return { audioBase64: base64Audio };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("TTS Error:", errorMsg);
      const token = classifyProviderError(errorMsg);
      await logAiUsage(ctx, { userId: logUserId, action: "tts", feature: AI_FEATURE.voice, model: ttsModel, startedAt: startTime, error: `${token}: ${errorMsg.slice(0, 180)}` });
      // ConvexError: plain Error messages are redacted to "Server Error" on
      // production deployments, which would break the client's token mapping
      throw new ConvexError(token);
    }
  },
});

// ---------------------------------------------------------------------------
// Action 4: generateImage
// Admin-only: protected by admin auth + tight rate limiting. Gemini or
// OpenRouter, optionally from a reference image (the current poster)
// ---------------------------------------------------------------------------

const RESOLUTION_SIZE: Record<string, string> = { "1k": "1K", "2k": "2K", "4k": "4K" };

type GenerateImageResult = { isGenerated: true; imageUrl: string; engine: string; costUsd?: number } | { isGenerated: false; imageUrl: null };

export const generateImage = action({
  args: {
    prompt: v.string(),
    style: v.optional(v.string()),
    model: v.optional(v.string()),
    resolution: v.optional(v.string()), // "1k", "2k", "4k"
    /** Image the result should start from: an upload (storage id) or the current image URL. */
    referenceStorageId: v.optional(v.id("_storage")),
    referenceUrl: v.optional(v.string()),
    engine: v.optional(v.union(v.literal("gemini"), v.literal("openrouter"))),
  },
  handler: async (ctx, args): Promise<GenerateImageResult> => {
    const startTime = Date.now();
    let userId = "unknown";
    try {
      userId = (await ctx.runQuery(api.lib.actionAuth.checkAdminAuth)) as string;
    } catch {
      throw new ConvexError("Só administradores podem gerar imagens.");
    }
    await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "ai:generateImage", userId });

    const settings = await ctx.runQuery(internal.settings.getForAI);
    const style = args.style ?? settings?.defaultImageStyle ?? "Cinematic lighting, photorealistic, community atmosphere, warm tones";
    let reference = null;
    try {
      reference = await loadReference(ctx, { storageId: args.referenceStorageId, url: args.referenceUrl });
    } catch (error) {
      if (error instanceof ConvexError) throw error;
      console.warn("generateImage: reference unreadable:", error instanceof Error ? error.message : error);
    }
    const lead = reference ? "Using the attached image as the starting point, keep its composition and identity and apply this change: " : "";
    const prompt = `${lead}${args.prompt.slice(0, 1500)}. Style: ${style}`;

    const { result, errors } = await generateWithFallback({
      prompt,
      reference,
      settings,
      engine: args.engine,
      geminiModel: args.model,
      imageSize: args.resolution ? RESOLUTION_SIZE[args.resolution] : undefined,
    });
    const log = (model: string, error?: string, costUsd?: number) =>
      logAiUsage(ctx, { userId, action: "generateImage", feature: AI_FEATURE.image, model, startedAt: startTime, costUsd, error });
    if (!result) {
      console.error("Image generation failed:", errors.join(" | "));
      await log(args.model ?? "unknown", errors.join(" | ") || "no image engine configured");
      // The client treats this as a failure; a stock photo would be saved as if generated
      return { isGenerated: false, imageUrl: null };
    }
    try {
      const stored = await storeGeneratedImage(ctx, result.image);
      await log(result.model, undefined, result.costUsd);
      return { isGenerated: true, imageUrl: stored.url, engine: result.engine, costUsd: result.costUsd };
    } catch (error) {
      const raw = error instanceof Error ? error.message : "store failed";
      await log(result.model, raw, result.costUsd);
      throw new ConvexError(classifyProviderError(raw));
    }
  },
});
