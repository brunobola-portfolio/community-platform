/**
 * Cost of AI calls, in USD. OpenRouter reports the real price of every call
 * (`usage.cost`); direct Gemini calls do not, so they are estimated from the
 * token counts in `usageMetadata` and the price table in aiDefaults.ts.
 * Pure on purpose: the actions, the admin panel and the tests share it.
 */

import {
  GEMINI_IMAGE_TOKENS,
  GEMINI_PRICES,
  DEFAULT_IMAGE_MODEL,
  OPENROUTER_IMAGE_COST_USD,
  type ModelPrice,
} from "./aiDefaults";

/** The subset of Gemini's `usageMetadata` the estimate needs. */
export interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  toolUsePromptTokenCount?: number;
  candidatesTokensDetails?: Array<{ modality?: string; tokenCount?: number }>;
}

/** OpenRouter's `usage` block; `cost` is in USD (credits). */
export interface OpenRouterUsage { cost?: number }

/** OpenRouter's zero-price slugs: the ":free" variants and the free router. */
export function isFreeModel(model: string | undefined): boolean {
  if (!model) return false;
  return model.endsWith(":free") || model === "openrouter/free";
}

/** Exact id first, then the longest known id it starts with (e.g. a "-preview" suffix). */
export function geminiPrice(model: string): ModelPrice | undefined {
  const id = model.replace(/^models\//, "");
  if (GEMINI_PRICES[id]) return GEMINI_PRICES[id];
  const prefix = Object.keys(GEMINI_PRICES)
    .filter(known => id.startsWith(known))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? GEMINI_PRICES[prefix] : undefined;
}

/**
 * Estimated cost of one Gemini reply. Thinking tokens are billed as output.
 * An image model that does not split its output by modality is assumed to
 * have spent it all on the picture, which is what it returns.
 */
export function geminiCost(model: string, usage: GeminiUsage | undefined | null): number | undefined {
  const price = geminiPrice(model);
  if (!price || !usage) return undefined;
  const input = (usage.promptTokenCount ?? 0) + (usage.toolUsePromptTokenCount ?? 0);
  const candidates = usage.candidatesTokenCount ?? 0;
  const details = usage.candidatesTokensDetails ?? [];
  const reported = details.filter(d => d.modality === "IMAGE").reduce((s, d) => s + (d.tokenCount ?? 0), 0);
  const image = price.imageOutput ? (details.length ? reported : candidates) : 0;
  const text = Math.max(0, candidates - image) + (usage.thoughtsTokenCount ?? 0);
  return (input * price.input + text * price.output + image * (price.imageOutput ?? 0)) / 1_000_000;
}

/** The price OpenRouter reported; free slugs cost nothing even when it is omitted. */
export function openRouterCost(model: string | undefined, usage: OpenRouterUsage | undefined | null): number | undefined {
  if (typeof usage?.cost === "number" && Number.isFinite(usage.cost)) return usage.cost;
  return isFreeModel(model) ? 0 : undefined;
}

/** Sum of the known parts; undefined only when no part is known. */
export function sumCosts(...costs: Array<number | undefined>): number | undefined {
  const known = costs.filter((c): c is number => typeof c === "number");
  return known.length ? known.reduce((s, c) => s + c, 0) : undefined;
}

/** Collects the cost of every provider call an action makes (classification, retries, the answer). */
export interface CostMeter {
  add: (cost: number | undefined) => void;
  readonly total: number | undefined;
}

export function createCostMeter(): CostMeter {
  const parts: Array<number | undefined> = [];
  return {
    add: cost => { parts.push(cost); },
    get total() { return sumCosts(...parts); },
  };
}

export interface ImageEstimateInput {
  engine: "gemini" | "openrouter";
  openrouterModel?: string;
  geminiModel?: string;
  resolution?: string;
}

/** What one picture is expected to cost, for the estimate shown before generating. */
export function estimateImageCostUsd(o: ImageEstimateInput): number | undefined {
  if (o.engine === "openrouter") {
    if (!o.openrouterModel) return undefined;
    return isFreeModel(o.openrouterModel) ? 0 : OPENROUTER_IMAGE_COST_USD[o.openrouterModel];
  }
  const price = geminiPrice(o.geminiModel ?? DEFAULT_IMAGE_MODEL);
  if (!price?.imageOutput) return undefined;
  const tokens = GEMINI_IMAGE_TOKENS[o.resolution ?? "1k"] ?? GEMINI_IMAGE_TOKENS["1k"];
  return (tokens * price.imageOutput) / 1_000_000;
}

/**
 * "0,08 $" for display. Sub-cent amounts keep one significant digit so a chat
 * reply does not read as free; unknown is a dash, never zero.
 */
export function formatUsd(cost: number | undefined | null): string {
  if (cost === undefined || cost === null || !Number.isFinite(cost)) return "—";
  if (cost === 0) return "0 $";
  const digits = cost >= 0.01 ? 2 : Math.min(6, Math.ceil(-Math.log10(cost)));
  return `${cost.toLocaleString("pt-PT", { minimumFractionDigits: cost >= 0.01 ? 2 : 0, maximumFractionDigits: digits })} $`;
}
