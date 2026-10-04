/**
 * Text half of the AI studio: sends the draft prompt (and the reference image,
 * when a model that can see is available) and returns the raw reply.
 *
 * Order: Gemini multimodal when GEMINI_API_KEY exists, then an OpenRouter
 * vision model when an OpenRouter key exists, then the configured
 * OpenAI-compatible provider text-only. Whether the reference was actually
 * seen is reported, so the secretary is told when it was not.
 */

import { DEFAULT_CHAT_MODEL, DEFAULT_CHAT_MODEL_FALLBACK, DEFAULT_OPENROUTER_VISION_MODEL, isAuthError } from "./aiDefaults";
import { getAI } from "./aiShared";
import { createCostMeter, geminiCost } from "./aiCost";
import { openAiCompatibleChat, resolveProvider, type ProviderSettings } from "./aiProvider";
import { openRouterChat, toDataUrl, type ContentPart, type ImageData } from "./openRouterRequest";

const TEXT_TIMEOUT_MS = 60_000;

export interface TextSettings extends ProviderSettings {
  chatModel?: string;
}

export interface TextReply { text: string; model: string; sawReference: boolean; errors: string[]; costUsd?: number }

interface PricedText { text: string; costUsd?: number }

async function viaGemini(prompt: string, reference: ImageData | null, model: string): Promise<PricedText> {
  const parts = reference
    ? [{ inlineData: { mimeType: reference.mimeType, data: reference.base64 } }, { text: prompt }]
    : [{ text: prompt }];
  const response = await getAI().models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: { responseMimeType: "application/json", temperature: 0.6 },
  });
  const text = response.text;
  if (!text) throw new Error("O Gemini devolveu uma resposta vazia.");
  return { text, costUsd: geminiCost(model, response.usageMetadata) };
}

async function viaOpenRouter(prompt: string, reference: ImageData | null, apiKey: string): Promise<PricedText> {
  const content: ContentPart[] = [{ type: "text", text: prompt }];
  if (reference) content.push({ type: "image_url", image_url: { url: toDataUrl(reference) } });
  const message = await openRouterChat(apiKey, {
    model: DEFAULT_OPENROUTER_VISION_MODEL,
    messages: [{ role: "user", content }],
    temperature: 0.6,
    response_format: { type: "json_object" },
  }, TEXT_TIMEOUT_MS);
  if (!message.content) throw new Error("O OpenRouter devolveu uma resposta vazia.");
  return { text: message.content, costUsd: message.costUsd };
}

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error)).slice(0, 160);

export async function draftText(settings: TextSettings | null, prompt: string, reference: ImageData | null): Promise<TextReply> {
  const errors: string[] = [];

  if (process.env.GEMINI_API_KEY) {
    const preferred = settings?.chatModel ?? process.env.GEMINI_CHAT_MODEL ?? DEFAULT_CHAT_MODEL;
    const models = [...new Set([preferred, DEFAULT_CHAT_MODEL_FALLBACK])];
    for (const model of models) {
      try {
        return { ...(await viaGemini(prompt, reference, model)), model, sawReference: Boolean(reference), errors };
      } catch (error) {
        errors.push(`gemini/${model}: ${describe(error)}`);
        if (isAuthError(describe(error))) break;
      }
    }
  }

  const openRouterKey = settings?.openrouterApiKey || process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      const reply = await viaOpenRouter(prompt, reference, openRouterKey);
      return { ...reply, model: DEFAULT_OPENROUTER_VISION_MODEL, sawReference: Boolean(reference), errors };
    } catch (error) {
      errors.push(`openrouter/${DEFAULT_OPENROUTER_VISION_MODEL}: ${describe(error)}`);
    }
  }

  // A self-hosted model behind the custom provider cannot be assumed to see images
  const provider = resolveProvider(settings);
  if (provider.kind === "custom") {
    try {
      const meter = createCostMeter();
      const text = await openAiCompatibleChat(provider, [{ role: "user", content: prompt }], meter);
      return { text, model: provider.model ?? "custom", sawReference: false, errors, costUsd: meter.total };
    } catch (error) {
      errors.push(`custom/${provider.model}: ${describe(error)}`);
    }
  }

  throw new Error(errors.length ? errors.join(" | ") : "Nenhum fornecedor de IA configurado.");
}
