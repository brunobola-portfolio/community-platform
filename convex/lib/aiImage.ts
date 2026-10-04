/**
 * Image generation shared by the MediaStudio ("Gerar com IA") and the AI
 * studio: two engines, an optional reference image, and storage + ledger
 * registration of the result.
 *
 * Gemini (NanoBanana) needs GEMINI_API_KEY in the deployment; OpenRouter (GPT
 * Image 2 and friends) needs the OpenRouter key from the settings or the env.
 * Every generated picture carries its cost: reported by OpenRouter, estimated
 * from Gemini's token counts.
 * The chosen engine is tried first and the other one only if it fails, so a
 * retired slug or an exhausted quota still yields an image when possible.
 */

import { Modality } from "@google/genai";
import { ConvexError } from "convex/values";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { DEFAULT_IMAGE_MODEL, DEFAULT_OPENROUTER_IMAGE_MODEL, isModelNotFoundError, OPENROUTER_NANOBANANA_MODEL } from "./aiDefaults";
import { getAI } from "./aiShared";
import { geminiCost } from "./aiCost";
import { openRouterChat, parseDataUrl, toDataUrl, type ImageData } from "./openRouterRequest";
import { isOwnStorageUrl, REFERENCE_URL_ERROR } from "./referenceUrl";

export type ImageEngine = "gemini" | "openrouter";
/** Portrait for posters, landscape for article covers. */
export type ImageAspect = "3:4" | "16:9";

export interface ImageSettings {
  imageModel?: string;
  imageProvider?: ImageEngine;
  openrouterApiKey?: string;
  openrouterImageModel?: string;
}

const SAFE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_REFERENCE_BYTES = 10 * 1024 * 1024;
// GPT Image 2 measured ~115 s for a text poster; the headroom keeps a slow day from failing
const IMAGE_TIMEOUT_MS = 240_000;

export function openRouterKey(settings: ImageSettings | null): string | undefined {
  return settings?.openrouterApiKey || process.env.OPENROUTER_API_KEY || undefined;
}

export function availableEngines(settings: ImageSettings | null): ImageEngine[] {
  const engines: ImageEngine[] = [];
  if (process.env.GEMINI_API_KEY) engines.push("gemini");
  if (openRouterKey(settings)) engines.push("openrouter");
  return engines;
}

/**
 * The engine an instance gets unless an admin chose one: NanoBanana (Gemini),
 * about a third of GPT Image's price per poster and ten times faster. GPT
 * Image is the default only when OpenRouter is the sole engine with a key.
 */
export function preferredImageEngine(settings: ImageSettings | null): ImageEngine {
  if (settings?.imageProvider) return settings.imageProvider;
  if (process.env.GEMINI_API_KEY) return "gemini";
  return openRouterKey(settings) ? "openrouter" : "gemini";
}

/** Plain-language reason a fallback happened, for the admin; null when nothing specific is known. */
export function fallbackReason(errors: string[]): string | null {
  const text = errors.join(" ").toLowerCase();
  if (/http 402|insufficient|credits|payment required/.test(text)) {
    return "a conta OpenRouter ficou sem saldo (carregue créditos em openrouter.ai para voltar ao GPT Image)";
  }
  if (/http 429|quota|rate limit|resource_exhausted/.test(text)) return "o motor escolhido atingiu o limite de pedidos";
  if (/timeout/.test(text)) return "o motor escolhido demorou demasiado a responder";
  return null;
}

/** The preferred engine first, then the rest; engines without credentials are left out. */
export function engineOrder(preferred: ImageEngine | undefined, available: ImageEngine[]): ImageEngine[] {
  if (!preferred || !available.includes(preferred)) return available;
  return [preferred, ...available.filter(e => e !== preferred)];
}

async function blobToImage(blob: Blob): Promise<ImageData> {
  const mimeType = (blob.type || "").split(";")[0].toLowerCase();
  if (!SAFE_IMAGE_TYPES.has(mimeType)) throw new Error("A referência não é uma imagem JPG, PNG ou WebP.");
  if (blob.size > MAX_REFERENCE_BYTES) throw new Error("A referência é demasiado grande.");
  return { mimeType, base64: Buffer.from(await blob.arrayBuffer()).toString("base64") };
}

/**
 * Reads the reference image. A storage id is read directly; a URL only when it
 * is a file of this deployment's own storage (see referenceUrl.ts), fetched
 * without following redirects so it cannot be bounced to another host.
 */
export async function loadReference(
  ctx: ActionCtx,
  ref: { storageId?: Id<"_storage">; url?: string },
): Promise<ImageData | null> {
  if (ref.storageId) {
    const blob = await ctx.storage.get(ref.storageId);
    return blob ? blobToImage(blob) : null;
  }
  if (!ref.url) return null;
  if (!isOwnStorageUrl(ref.url, process.env.CONVEX_CLOUD_URL)) throw new ConvexError(REFERENCE_URL_ERROR);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(ref.url, { signal: controller.signal, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) throw new ConvexError(REFERENCE_URL_ERROR);
    if (!res.ok) throw new Error(`Referência HTTP ${res.status}`);
    return await blobToImage(await res.blob());
  } finally {
    clearTimeout(timer);
  }
}

interface GeminiPart { inlineData?: { data?: string; mimeType?: string } }

interface PricedImage { image: ImageData; costUsd?: number }

async function geminiImage(prompt: string, reference: ImageData | null, model: string, aspect?: ImageAspect, imageSize?: string): Promise<PricedImage> {
  const parts = reference
    ? [{ inlineData: { mimeType: reference.mimeType, data: reference.base64 } }, { text: prompt }]
    : [{ text: prompt }];
  const response = await getAI().models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.IMAGE],
      imageConfig: { ...(aspect ? { aspectRatio: aspect } : {}), ...(imageSize ? { imageSize } : {}) },
    },
  });
  const found = (response.candidates?.[0]?.content?.parts as GeminiPart[] | undefined)
    ?.find(p => p.inlineData?.mimeType?.startsWith("image/") && p.inlineData.data);
  if (!found?.inlineData?.data || !found.inlineData.mimeType) throw new Error("O Gemini não devolveu imagem.");
  return {
    image: { base64: found.inlineData.data, mimeType: found.inlineData.mimeType },
    costUsd: geminiCost(model, response.usageMetadata),
  };
}

async function openRouterImage(prompt: string, reference: ImageData | null, apiKey: string, model: string, aspect?: ImageAspect): Promise<PricedImage> {
  const content = reference
    ? [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: toDataUrl(reference) } }]
    : [{ type: "text", text: prompt }];
  const message = await openRouterChat(apiKey, {
    model,
    modalities: ["image", "text"],
    messages: [{ role: "user", content }],
    ...(aspect ? { image_config: { aspect_ratio: aspect } } : {}),
  }, IMAGE_TIMEOUT_MS);
  const url = message.images?.[0]?.image_url?.url;
  if (!url) throw new Error("O OpenRouter não devolveu imagem.");
  const inline = parseDataUrl(url);
  if (inline) return { image: inline, costUsd: message.costUsd };
  // Some providers answer with a hosted URL instead of a data URL
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Imagem do OpenRouter HTTP ${res.status}`);
  return { image: await blobToImage(await res.blob()), costUsd: message.costUsd };
}

export interface GenerateOptions {
  prompt: string;
  reference: ImageData | null;
  settings: ImageSettings | null;
  engine?: ImageEngine;
  /** Gemini model chosen in the MediaStudio; the settings decide otherwise. */
  geminiModel?: string;
  /** Unset keeps the model's default, or the reference's proportions when there is one. */
  aspect?: ImageAspect;
  imageSize?: string;
}

export interface GeneratedImage { image: ImageData; engine: ImageEngine; model: string; costUsd?: number }

/**
 * Model for an OpenRouter attempt: the admin's OpenRouter choice when OpenRouter
 * was preferred, otherwise NanoBanana through OpenRouter, so falling back from
 * Gemini keeps the same engine family and price instead of jumping to GPT Image.
 */
export function openRouterImageModel(preferred: ImageEngine, settings: ImageSettings | null): string {
  if (preferred === "openrouter") return settings?.openrouterImageModel || DEFAULT_OPENROUTER_IMAGE_MODEL;
  return OPENROUTER_NANOBANANA_MODEL;
}

/** Tries each available engine in order; returns null with the errors when all fail. */
export async function generateWithFallback(o: GenerateOptions): Promise<{ result: GeneratedImage | null; errors: string[] }> {
  const errors: string[] = [];
  const preferred = o.engine ?? preferredImageEngine(o.settings);
  const order = engineOrder(preferred, availableEngines(o.settings));
  for (const engine of order) {
    if (engine === "gemini") {
      const configured = o.geminiModel ?? o.settings?.imageModel ?? process.env.GEMINI_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL;
      const models = configured === DEFAULT_IMAGE_MODEL ? [configured] : [configured, DEFAULT_IMAGE_MODEL];
      for (const model of models) {
        try {
          return { result: { ...(await geminiImage(o.prompt, o.reference, model, o.aspect, o.imageSize)), engine, model }, errors };
        } catch (error) {
          const raw = error instanceof Error ? error.message : String(error);
          errors.push(`gemini/${model}: ${raw.slice(0, 160)}`);
          if (!isModelNotFoundError(raw)) break;
        }
      }
    } else {
      const model = openRouterImageModel(preferred, o.settings);
      try {
        const key = openRouterKey(o.settings) ?? "";
        return { result: { ...(await openRouterImage(o.prompt, o.reference, key, model, o.aspect)), engine, model }, errors };
      } catch (error) {
        errors.push(`openrouter/${model}: ${(error instanceof Error ? error.message : String(error)).slice(0, 160)}`);
      }
    }
  }
  return { result: null, errors };
}

/** Stores the image and registers it in the uploads ledger, so an unsaved one is swept. */
export async function storeGeneratedImage(ctx: ActionCtx, image: ImageData): Promise<{ url: string; storageId: Id<"_storage"> }> {
  if (!SAFE_IMAGE_TYPES.has(image.mimeType)) throw new Error("Tipo de imagem não suportado.");
  const blob = new Blob([Buffer.from(image.base64, "base64")], { type: image.mimeType });
  const storageId = await ctx.storage.store(blob);
  const url = await ctx.storage.getUrl(storageId);
  if (!url) throw new Error("Não foi possível obter o URL da imagem gerada.");
  await ctx.runMutation(internal.files.registerGenerated, { storageId, url });
  return { url, storageId };
}
