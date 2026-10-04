/**
 * Pure helpers over the help content: token filling, ranking search and the
 * tab-to-tutorial lookup that feeds the contextual "Como funciona" button.
 */

import { normalize } from '../../utils/text';
import { plainText } from './format';
import type { Tab } from '../../pages/admin/types';
import type { HelpTutorial } from './types';

export interface HelpTokens {
    siteName: string;
}

/** Words so common in pt-PT questions that matching them would return everything. */
const STOPWORDS = new Set([
    'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas',
    'para', 'com', 'como', 'que', 'se', 'por', 'ao', 'aos', 'eu', 'me', 'meu', 'minha', 'posso', 'faco', 'fazer',
    'nao', 'quero', 'onde', 'esta', 'sao', 'mais',
]);

/** Title hits outrank keyword hits, which outrank hits buried in the steps; typos cost a little. */
const WEIGHT = { title: 5, keyword: 3, body: 1 } as const;
const FUZZY_FACTOR = 0.6;

type Field = keyof typeof WEIGHT;

interface Haystack {
    text: string;
    words: string[];
}

export function fillTokens(text: string, tokens: HelpTokens): string {
    return text.replace(/\{siteName\}/g, tokens.siteName);
}

/**
 * Crude pt-PT plural folding, enough for "inscrições" to find "inscrição" and
 * "quotas" to find "quota" without a dictionary.
 */
export function stem(word: string): string {
    if (word.length <= 3) return word;
    if (word.endsWith('coes')) return `${word.slice(0, -4)}cao`;
    if (word.endsWith('oes')) return `${word.slice(0, -3)}ao`;
    if (word.endsWith('ais')) return `${word.slice(0, -3)}al`;
    if (word.endsWith('eis')) return `${word.slice(0, -3)}el`;
    if (word.endsWith('ns')) return `${word.slice(0, -2)}m`;
    if (/[rzs]es$/.test(word) && word.length > 5) return word.slice(0, -2);
    if (word.endsWith('s')) return word.slice(0, -1);
    return word;
}

export function queryTerms(query: string): string[] {
    return normalize(query)
        .split(/[^a-z0-9€]+/)
        .filter(term => term.length > 1 && !STOPWORDS.has(term));
}

/** Optimal string alignment distance (a swap of two letters counts as one typo). */
export function editDistance(a: string, b: string): number {
    const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
            }
        }
    }
    return rows[a.length][b.length];
}

const allowedTypos = (term: string) => (term.length >= 8 ? 2 : term.length >= 4 ? 1 : 0);

function toHaystack(raw: string): Haystack {
    const text = normalize(plainText(raw));
    return { text, words: text.split(/[^a-z0-9€]+/).filter(Boolean).map(stem) };
}

const cache = new WeakMap<HelpTutorial, Record<Field, Haystack>>();

function haystacks(tutorial: HelpTutorial): Record<Field, Haystack> {
    const cached = cache.get(tutorial);
    if (cached) return cached;
    const body = [tutorial.summary, tutorial.recap, ...tutorial.steps.flatMap(s => [s.text, s.tip ?? '', s.why ?? '', s.warning ?? ''])].join(' ');
    const built = { title: toHaystack(tutorial.title), keyword: toHaystack(tutorial.keywords.join(' ')), body: toHaystack(body) };
    cache.set(tutorial, built);
    return built;
}

/** 1 for an exact or prefix hit, FUZZY_FACTOR for a near miss, 0 for nothing. */
function matchQuality(term: string, field: Haystack): number {
    const stemmed = stem(term);
    if (field.text.includes(term) || field.words.some(w => w.startsWith(stemmed))) return 1;
    const typos = allowedTypos(stemmed);
    if (typos === 0) return 0;
    const near = field.words.some(w =>
        editDistance(stemmed, w) <= typos
        || (w.length > stemmed.length && editDistance(stemmed, w.slice(0, stemmed.length)) <= 1));
    return near ? FUZZY_FACTOR : 0;
}

function termScore(term: string, fields: Record<Field, Haystack>): number {
    let best = 0;
    for (const field of Object.keys(WEIGHT) as Field[]) {
        best = Math.max(best, matchQuality(term, fields[field]) * WEIGHT[field]);
    }
    return best;
}

/**
 * Every term must appear somewhere (so "quota sócio" narrows instead of widening);
 * ties keep the content order, which is already the reading order.
 */
export function searchHelp(tutorials: HelpTutorial[], query: string): HelpTutorial[] {
    const terms = queryTerms(query);
    if (terms.length === 0) return [];
    const scored: Array<{ tutorial: HelpTutorial; score: number; index: number }> = [];
    tutorials.forEach((tutorial, index) => {
        const fields = haystacks(tutorial);
        let score = 0;
        for (const term of terms) {
            const points = termScore(term, fields);
            if (points === 0) return;
            score += points;
        }
        scored.push({ tutorial, score, index });
    });
    return scored.sort((a, b) => b.score - a.score || a.index - b.index).map(s => s.tutorial);
}

/** Tutorials about a backoffice tab: the ones that target it first, then the related ones. */
export function tutorialsForTab(tutorials: HelpTutorial[], tab: Tab): HelpTutorial[] {
    const primary = tutorials.filter(t => t.tab === tab);
    const related = tutorials.filter(t => t.tab !== tab && t.relatedTabs?.includes(tab));
    return [...primary, ...related];
}

/**
 * Guides to read next: the explicit `related` list when the author gave one,
 * otherwise the neighbours in the same category.
 */
export function relatedTutorials(tutorials: HelpTutorial[], tutorial: HelpTutorial, limit = 3): HelpTutorial[] {
    const explicit = (tutorial.related ?? [])
        .map(id => tutorials.find(t => t.id === id))
        .filter((t): t is HelpTutorial => Boolean(t));
    const pool = explicit.length ? explicit : tutorials.filter(t => t.category === tutorial.category && t.id !== tutorial.id);
    return pool.slice(0, limit);
}
