/**
 * Single source of truth for AI model defaults.
 *
 * Both the frontend (utils/defaultSettings.ts) and the server actions
 * (convex/ai.ts) read from here, so a fresh deployment advertises in the
 * admin UI exactly the models the server will call. Runtime overrides come
 * from DB settings first, then env vars, then these constants.
 */
export const DEFAULT_CHAT_MODEL = "gemini-3.5-flash";
export const DEFAULT_CHAT_MODEL_FALLBACK = "gemini-3.5-flash-lite";
export const DEFAULT_TTS_MODEL = "gemini-2.5-flash-preview-tts";
export const DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image";

/** Curated Gemini catalogue for the admin selectors; one list, three screens. */
export const GEMINI_CHAT_MODELS = [
  { id: "gemini-3.7-flash", label: "Gemini 3.7 Flash (mais recente)" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (recomendado)" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (económico)" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
] as const;
export const GEMINI_TTS_MODELS = [
  { id: "gemini-2.5-flash-preview-tts", label: "Gemini 2.5 Flash TTS" },
  { id: "gemini-3.1-flash-tts-preview", label: "Gemini 3.1 Flash TTS (preview)" },
] as const;
export const GEMINI_IMAGE_MODELS = [
  { id: "gemini-3.1-flash-lite-image", label: "NanoBanana 2 Lite (económico)" },
  { id: "gemini-3.1-flash-image", label: "NanoBanana 2 (recomendado)" },
  { id: "gemini-3-pro-image", label: "NanoBanana Pro (qualidade máxima)" },
  { id: "gemini-2.5-flash-image", label: "NanoBanana (legado)" },
] as const;
/**
 * OpenRouter image models that accept a reference image. GPT Image 2 is the
 * engine behind ChatGPT's image generation; it renders poster text best.
 */
export const DEFAULT_OPENROUTER_IMAGE_MODEL = "openai/gpt-5.4-image-2";
/**
 * NanoBanana through OpenRouter: the fallback when Gemini direct fails (a free
 * Gemini key has no image quota), so a NanoBanana instance never silently pays
 * GPT Image prices.
 */
export const OPENROUTER_NANOBANANA_MODEL = "google/gemini-3.1-flash-image";
export const OPENROUTER_IMAGE_MODELS = [
  { id: "openai/gpt-5.4-image-2", label: "GPT Image 2 — o do ChatGPT, qualidade máxima (~2 min, ~0,23 $)" },
  { id: "openai/gpt-5-image-mini", label: "GPT Image Mini — económico (~50 s, ~0,04 $)" },
  { id: "google/gemini-3-pro-image", label: "NanoBanana Pro via OpenRouter (~30 s)" },
  { id: "google/gemini-3.1-flash-image", label: "NanoBanana 2 via OpenRouter — o mais rápido (~10 s, ~0,07 $)" },
] as const;
/**
 * Vision-capable OpenRouter model the AI studio uses to read a reference poster
 * when the deployment has no GEMINI_API_KEY (the configured chat model may be a
 * free text-only slug).
 */
export const DEFAULT_OPENROUTER_VISION_MODEL = "google/gemini-2.5-flash";
// OpenRouter fallback when the configured slug disappears (free-tier slugs
// rotate often): Google open-weights MoE, 4B active params — fast, free,
// solid Portuguese
export const DEFAULT_OPENROUTER_MODEL = "google/gemma-4-26b-a4b-it:free";
// Tried in order when the configured slug is retired or rate-limited upstream
// (free slugs share capacity); the chat then falls back to Gemini if a key exists
export const OPENROUTER_FALLBACK_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
  "z-ai/glm-5.2:free",
  "minimax/minimax-m2.7:free",
];

/**
 * Bad or missing credentials. The only provider failure where walking the
 * fallback chain is pointless — every candidate would fail the same way.
 */
export function isAuthError(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthorized") ||
    lower.includes("api key") ||
    lower.includes("api_key") ||
    lower.includes("permission_denied")
  );
}

/**
 * Detects the provider error for a model id that was retired or renamed.
 * Google shuts down old families (1.x, 2.0 are gone); instances whose DB
 * settings still name a retired model would otherwise hard-fail until an
 * admin edits them. Callers use this to retry once with the current default.
 */
export function isModelNotFoundError(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.includes("not_found") ||
    lower.includes("no longer available") ||
    (lower.includes("404") && lower.includes("model"))
  );
}

/** USD per 1M tokens; `imageOutput` prices the image tokens of an image model's reply. */
export interface ModelPrice { input: number; output: number; imageOutput?: number }

/**
 * Paid-tier Gemini API prices (standard, not batch), checked on 2026-10-04
 * against ai.google.dev/gemini-api/docs/pricing and the OpenRouter catalogue,
 * which resells the same Google models at the same rates. Used only to
 * estimate the cost of direct Gemini calls, which, unlike OpenRouter, do not
 * report a price. Gemini 3.7 Flash doubles on 2027-01-01. Grounding searches
 * are left out: the first 5,000 a month are free.
 */
export const GEMINI_PRICES: Record<string, ModelPrice> = {
  "gemini-3.7-flash": { input: 0.75, output: 3.75 },
  "gemini-3.5-flash": { input: 1.5, output: 9 },
  "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-3.1-flash-image": { input: 0.5, output: 3, imageOutput: 60 },
  "gemini-3.1-flash-lite-image": { input: 0.25, output: 1.5, imageOutput: 30 },
  "gemini-3-pro-image": { input: 2, output: 12, imageOutput: 120 },
  "gemini-2.5-flash-image": { input: 0.3, output: 2.5, imageOutput: 30 },
  // TTS output is audio tokens (25 per second of speech)
  "gemini-2.5-flash-preview-tts": { input: 0.5, output: 10 },
  "gemini-3.1-flash-tts-preview": { input: 1, output: 20 },
};

/** Image tokens a Gemini image model spends per picture, by resolution (Google's published counts). */
export const GEMINI_IMAGE_TOKENS: Record<string, number> = { "1k": 1120, "2k": 1680, "4k": 2520 };

/**
 * Measured cost of one picture on the OpenRouter image models (2026-10-04),
 * for the estimate shown before generating; the real cost comes back from
 * OpenRouter with each call.
 */
export const OPENROUTER_IMAGE_COST_USD: Record<string, number> = {
  "openai/gpt-5.4-image-2": 0.23,
  "openai/gpt-5-image-mini": 0.04,
  "google/gemini-3-pro-image": 0.14,
  "google/gemini-3.1-flash-image": 0.07,
};

/** A studio draft's text half on the default chat model (measured 0.0199 USD on 2026-10-04). */
export const STUDIO_TEXT_COST_USD = 0.02;
