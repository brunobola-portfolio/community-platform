/**
 * Periods, estimates and sentences shared by the AI usage panel, the dashboard
 * tile, the AI studio and the MediaStudio. Kept pure so every screen quotes
 * the same numbers.
 */

import { estimateImageCostUsd, formatUsd, sumCosts } from '../../../convex/lib/aiCost';
import { OPENROUTER_IMAGE_MODELS, STUDIO_TEXT_COST_USD } from '../../../convex/lib/aiDefaults';

export type UsagePeriod = '7d' | '30d' | 'month';
export type ImageEngine = 'gemini' | 'openrouter';

export const PERIOD_LABEL: Record<UsagePeriod, string> = {
    '7d': '7 dias',
    '30d': '30 dias',
    month: 'Este mês',
};

/** First day of the current month, local midnight, so "este mês" is the admin's calendar month. */
export function monthStart(now: Date = new Date()): number {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

/** Local midnight at the start of the period; stable for a whole day, so the query is not re-run on every render. */
export function periodStart(period: UsagePeriod, now: Date = new Date()): number {
    if (period === 'month') return monthStart(now);
    const days = period === '7d' ? 6 : 29;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days).getTime();
}

/** Short name of an engine for sentences ("≈ 0,07 $ com NanoBanana"). */
export function engineName(engine: ImageEngine, openrouterModel?: string): string {
    if (engine === 'gemini') return 'NanoBanana';
    if (openrouterModel?.includes('gpt-5-image-mini')) return 'GPT Image Mini';
    if (openrouterModel?.startsWith('openai/')) return 'GPT Image';
    return OPENROUTER_IMAGE_MODELS.find(m => m.id === openrouterModel)?.label.split(' — ')[0] ?? 'OpenRouter';
}

export interface EstimateInput {
    engine?: ImageEngine;
    openrouterModel?: string;
    geminiModel?: string;
    resolution?: string;
}

/** Expected cost of one picture, or undefined when the model has no known price. */
export function imageEstimate(o: EstimateInput): number | undefined {
    if (!o.engine) return undefined;
    return estimateImageCostUsd({ engine: o.engine, openrouterModel: o.openrouterModel, geminiModel: o.geminiModel, resolution: o.resolution });
}

/** "≈ 0,08 $ com NanoBanana" for a studio draft: the text plus, when asked for, the picture. */
export function studioEstimateLine(withImage: boolean, o: EstimateInput): string {
    if (!withImage || !o.engine) return `≈ ${formatUsd(STUDIO_TEXT_COST_USD)} (só texto)`;
    const total = sumCosts(STUDIO_TEXT_COST_USD, imageEstimate(o));
    return `≈ ${formatUsd(total)} com ${engineName(o.engine, o.openrouterModel)}`;
}

/** The sentence added to the notes once the draft exists; nothing when the cost is unknown. */
export function draftCostSentence(cost: number | undefined): string | null {
    return cost === undefined ? null : `Este rascunho custou ${formatUsd(cost)}.`;
}

/** Spend versus budget as a 0–100 share for the progress bar. */
export function budgetShare(spent: number, budget: number | undefined): number {
    if (!budget || budget <= 0) return 0;
    return Math.min(100, Math.round((spent / budget) * 100));
}
