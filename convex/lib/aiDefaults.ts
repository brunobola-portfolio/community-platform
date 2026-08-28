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
