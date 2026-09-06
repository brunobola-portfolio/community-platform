"use node";

import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import { resolveProvider, openAiCompatibleChat } from "./lib/aiProvider";
import { DEFAULT_CHAT_MODEL_FALLBACK } from "./lib/aiDefaults";
import { getAI, classifyProviderError, consumePublicBudget, injectionPatterns } from "./lib/aiShared";

/**
 * Text actions: geo assistant for the About page and editorial text enhancement.
 */
// ---------------------------------------------------------------------------
// Action 3: geoQuery
// Location-aware queries about the association venue using Google Maps grounding
// ---------------------------------------------------------------------------
export const geoQuery = action({
  args: {
    query: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    let geoModel = "unknown";
    try {
      // Public geo queries: per-session bucket plus the global ceiling
      const userId = await ctx.runQuery(api.lib.actionAuth.getOptionalAuth);
      await consumePublicBudget(ctx, "ai:geoQuery", userId as string | null, args.sessionId);
      const aiSettings = await ctx.runQuery(internal.settings.getForAI);
      if (aiSettings?.enableChatbot === false) throw new ConvexError("ERR_UNAVAILABLE");

      // Input sanitization: length limit and injection check
      const safeQuery = args.query.slice(0, 500);
      if (injectionPatterns.test(safeQuery)) {
        return { text: "Posso ajudar-te com informações sobre a localização da associação e serviços na zona envolvente. Reformula a tua pergunta, por favor." };
      }

      const ai = getAI();
      const settings = await ctx.runQuery(api.settings.getPublic);

      // AI model from DB settings, then env vars, then defaults
      const model =
        settings?.chatModelFallback ?? process.env.GEMINI_CHAT_MODEL_FALLBACK ?? DEFAULT_CHAT_MODEL_FALLBACK;
      geoModel = model;

      // Venue coordinates from DB settings, then env vars (SITE_* preferred,
      // ARCVA_* kept for the reference instance), then a neutral default
      const LOCATION = {
        lat: parseFloat(settings?.latitude ?? process.env.SITE_LATITUDE ?? process.env.ARCVA_LATITUDE ?? "38.7223"),
        lng: parseFloat(settings?.longitude ?? process.env.SITE_LONGITUDE ?? process.env.ARCVA_LONGITUDE ?? "-9.1393"),
      };

      const response = await ai.models.generateContent({
        model,
        contents: safeQuery,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: LOCATION.lat,
                longitude: LOCATION.lng,
              },
            },
          },
          systemInstruction:
            `Es um assistente local da ${settings?.siteName ?? "associação"}${settings?.address ? `, com sede em ${settings.address}` : ""}. Responde APENAS a perguntas sobre localização, geografia, direções, serviços locais e pontos de interesse na zona envolvente da associação. Recusa educadamente perguntas fora deste âmbito. Responde de forma curta, elegante e útil em Português de Portugal.`,
        },
      });

      const text = response.text ?? "Informação não encontrada.";

      // Log success
      try {
        await ctx.runMutation(internal.aiLogs.log, {
          userId: (userId as string | null) ?? "anonymous",
          action: "geoQuery",
          model: geoModel,
          latencyMs: Date.now() - startTime,
          success: true,
        });
      } catch { /* ignore logging errors */ }

      return { text };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Geo Query error:", errorMsg);
      const token = classifyProviderError(errorMsg);
      // Log failure
      try {
        await ctx.runMutation(internal.aiLogs.log, {
          userId: "unknown",
          action: "geoQuery",
          model: geoModel ?? "unknown",
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
// Action 5: enhanceText
// Admin-only: protected by admin auth + tight rate limiting
// AI-powered text enhancement for community content
// ---------------------------------------------------------------------------
export const enhanceText = action({
  args: {
    text: v.string(),
    tone: v.optional(v.string()),
    targetField: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    let enhanceModel = "unknown";
    try {
      // Admin auth + rate limiting
      const userId = await ctx.runQuery(api.lib.actionAuth.checkAdminAuth);
      await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, {
        key: "ai:enhanceText",
        userId: userId as string,
      });

      // Truncate input to prevent abuse with very large payloads
      const safeText = args.text.slice(0, 8000);

      // Provider-aware: text enhancement works on any configured provider
      const settings = await ctx.runQuery(internal.settings.getForAI);
      const provider = resolveProvider(settings);
      const tone =
        args.tone ?? settings?.contentTone ?? "Profissional e Inspirador";
      const prompt = `Rewrite this for a community website. Tone: ${tone}. Lang: PT-PT. Keep HTML tags. Text: ${safeText}`;

      let enhancedText: string | undefined;
      if (provider.kind === "gemini") {
        const ai = getAI();
        const model =
          settings?.chatModelFallback ?? process.env.GEMINI_CHAT_MODEL_FALLBACK ?? DEFAULT_CHAT_MODEL_FALLBACK;
        enhanceModel = model;
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        enhancedText = response.text ?? undefined;
      } else {
        enhanceModel = provider.model ?? "openai-compatible";
        enhancedText = await openAiCompatibleChat(provider, [
          { role: "user", content: prompt },
        ]);
      }

      if (!enhancedText) {
        throw new Error("O modelo não devolveu texto melhorado.");
      }

      // Log success
      try {
        await ctx.runMutation(internal.aiLogs.log, {
          userId: userId as string,
          action: "enhanceText",
          model: enhanceModel,
          latencyMs: Date.now() - startTime,
          success: true,
        });
      } catch { /* ignore logging errors */ }

      return { enhancedText };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Text Enhancement error:", errorMsg);
      // Log failure
      try {
        await ctx.runMutation(internal.aiLogs.log, {
          userId: "unknown",
          action: "enhanceText",
          model: enhanceModel ?? "unknown",
          latencyMs: Date.now() - startTime,
          success: false,
          errorMessage: errorMsg.slice(0, 200),
        });
      } catch { /* ignore logging errors */ }
      throw new Error(`Erro na melhoria de texto: ${errorMsg}`);
    }
  },
});
