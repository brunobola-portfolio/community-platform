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
