"use node";

import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { Modality } from "@google/genai";
import { api, internal } from "./_generated/api";
import { DEFAULT_TTS_MODEL, DEFAULT_IMAGE_MODEL } from "./lib/aiDefaults";
import { getAI, classifyProviderError, consumePublicBudget } from "./lib/aiShared";

/**
 * Media actions: text-to-speech and image generation (always Gemini).
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
    try {
      // Public TTS: optional auth, shared rate-limit bucket for anonymous use
      const userId = await ctx.runQuery(api.lib.actionAuth.getOptionalAuth);
      await consumePublicBudget(ctx, "ai:tts", userId as string | null, args.sessionId);
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

      // Log success
      try {
        await ctx.runMutation(internal.aiLogs.log, {
          userId: (userId as string | null) ?? "anonymous",
          action: "tts",
          model: ttsModel,
          latencyMs: Date.now() - startTime,
          success: true,
        });
      } catch { /* ignore logging errors */ }

      return { audioBase64: base64Audio };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("TTS Error:", errorMsg);
      const token = classifyProviderError(errorMsg);
      // Log failure
      try {
        await ctx.runMutation(internal.aiLogs.log, {
          userId: "unknown",
          action: "tts",
          model: ttsModel,
          latencyMs: Date.now() - startTime,
          success: false,
          errorMessage: `${token}: ${errorMsg.slice(0, 180)}`,
        });
      } catch { /* ignore logging errors */ }
      // ConvexError: plain Error messages are redacted to "Server Error" on
      // production deployments, which would break the client's token mapping
      throw new ConvexError(token);
    }
  },
});

// ---------------------------------------------------------------------------
// Action 4: generateImage
// Admin-only: protected by admin auth + tight rate limiting
// Image generation via Gemini, with Unsplash fallback
// ---------------------------------------------------------------------------

interface GeminiPart {
  inlineData?: { data: string; mimeType: string };
}

const SAFE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const generateImage = action({
  args: {
    prompt: v.string(),
    style: v.optional(v.string()),
    model: v.optional(v.string()),
    resolution: v.optional(v.string()), // "1k", "2k", "4k"
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    let imageModel = "unknown";
    try {
      // Admin auth + rate limiting
      const userId = await ctx.runQuery(api.lib.actionAuth.checkAdminAuth);
      await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
        key: "ai:generateImage",
        userId: userId as string,
      });

      const ai = getAI();

      // Read settings for default image style; model from env vars or args
      const settings = await ctx.runQuery(api.settings.getPublic);
      const defaultStyle =
        settings?.defaultImageStyle ??
        "Cinematic lighting, photorealistic, 4k, community atmosphere, warm tones";
      imageModel =
        args.model ??
        settings?.imageModel ??
        process.env.GEMINI_IMAGE_MODEL ??
        DEFAULT_IMAGE_MODEL;

      // Map resolution to quality hint in prompt
      const resolutionHint =
        args.resolution === "4k"
          ? ", ultra high resolution 4k"
          : args.resolution === "2k"
            ? ", high resolution 2k"
            : args.resolution === "1k"
              ? ", 1080p resolution"
              : "";

      const style = args.style ?? defaultStyle;
      const enhancedPrompt = `${args.prompt}, ${style}${resolutionHint}`;

      try {
        const response = await ai.models.generateContent({
          model: imageModel,
          contents: enhancedPrompt,
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });

        // Extract image data from response with proper type guard
        const parts = response.candidates?.[0]?.content?.parts as GeminiPart[] | undefined;
        const imagePart = parts?.find((p: GeminiPart) =>
          p.inlineData?.mimeType?.startsWith("image/")
        );

        if (imagePart?.inlineData?.data && imagePart?.inlineData?.mimeType) {
          const mimeType = imagePart.inlineData.mimeType;
          if (!SAFE_IMAGE_TYPES.has(mimeType)) {
            throw new Error("Tipo de imagem não suportado.");
          }

          // Convert base64 to Blob and upload to Convex storage
          const binaryData = Buffer.from(
            imagePart.inlineData.data,
            "base64"
          );
          const blob = new Blob([binaryData], { type: mimeType });
          const storageId = await ctx.storage.store(blob);
          const imageUrl = await ctx.storage.getUrl(storageId);

          if (imageUrl) {
            // Log success
            try {
              await ctx.runMutation(internal.aiLogs.log, {
                userId: userId as string,
                action: "generateImage",
                model: imageModel,
                latencyMs: Date.now() - startTime,
                success: true,
              });
            } catch { /* ignore logging errors */ }
            return { imageUrl, storageId, isGenerated: true };
          }
        }

        // Fallback if no image data in response
        console.warn("No image data in Gemini response, using placeholder.");
        // Log success (fallback)
        try {
          await ctx.runMutation(internal.aiLogs.log, {
            userId: userId as string,
            action: "generateImage",
            model: imageModel,
            latencyMs: Date.now() - startTime,
            success: true,
          });
        } catch { /* ignore logging errors */ }
        const imageUrl =
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop";
        return { imageUrl, isGenerated: false };
      } catch (imgError) {
        console.warn(
          "Image generation failed, using placeholder:",
          imgError instanceof Error ? imgError.message : imgError
        );
        // Log failure (inner)
        try {
          await ctx.runMutation(internal.aiLogs.log, {
            userId: userId as string,
            action: "generateImage",
            model: imageModel,
            latencyMs: Date.now() - startTime,
            success: false,
            errorMessage: (imgError instanceof Error ? imgError.message : "Image generation failed").slice(0, 200),
          });
        } catch { /* ignore logging errors */ }
        const imageUrl =
          "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000";
        return { imageUrl, isGenerated: false };
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Image Generation error:", errorMsg);
      // Log failure
      try {
        await ctx.runMutation(internal.aiLogs.log, {
          userId: "unknown",
          action: "generateImage",
          model: imageModel ?? "unknown",
          latencyMs: Date.now() - startTime,
          success: false,
          errorMessage: errorMsg.slice(0, 200),
        });
      } catch { /* ignore logging errors */ }
      throw new Error(`Erro na geração de imagem: ${errorMsg}`);
    }
  },
});
