/**
 * "Feito" ticks per guide, kept only in this browser. Pure parsing lives here so
 * a stale or hand-edited entry (a guide that lost a step) can never break the reader.
 */

const PREFIX = 'help:done:';

export const progressKey = (tutorialId: string): string => `${PREFIX}${tutorialId}`;

/** Step indexes ticked, deduplicated, sorted and clipped to the guide's current length. */
export function parseDone(raw: string | null, stepCount: number): number[] {
    if (!raw) return [];
    try {
        const value: unknown = JSON.parse(raw);
        if (!Array.isArray(value)) return [];
        const valid = value.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < stepCount);
        return [...new Set(valid)].sort((a, b) => a - b);
    } catch {
        return [];
    }
}

export function toggleDone(done: number[], index: number): number[] {
    return done.includes(index) ? done.filter(n => n !== index) : [...done, index].sort((a, b) => a - b);
}
