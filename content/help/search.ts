/**
 * Pure helpers over the help content: token filling, ranking search and the
 * tab-to-tutorial lookup that feeds the contextual "Como funciona" button.
 */

import { normalize } from '../../utils/text';
import type { Tab } from '../../pages/admin/types';
import type { HelpTutorial } from './types';

export interface HelpTokens {
    siteName: string;
}

/** Words so common in pt-PT questions that matching them would return everything. */
const STOPWORDS = new Set([
    'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas',
    'para', 'com', 'como', 'que', 'se', 'por', 'ao', 'aos', 'eu', 'me', 'meu', 'minha', 'posso', 'faco', 'fazer',
]);

/** Title hits outrank keyword hits, which outrank hits buried in the steps. */
const WEIGHT = { title: 5, keyword: 3, body: 1 } as const;

export function fillTokens(text: string, tokens: HelpTokens): string {
    return text.replace(/\{siteName\}/g, tokens.siteName);
}

export function queryTerms(query: string): string[] {
    return normalize(query)
        .split(/[^a-z0-9€]+/)
        .filter(term => term.length > 1 && !STOPWORDS.has(term));
}

function haystacks(tutorial: HelpTutorial) {
    const body = [tutorial.summary, ...tutorial.steps.flatMap(s => [s.text, s.tip ?? '', s.warning ?? ''])].join(' ');
    return {
        title: normalize(tutorial.title),
        keyword: normalize(tutorial.keywords.join(' ')),
        body: normalize(body),
    };
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
        const text = haystacks(tutorial);
        let score = 0;
        for (const term of terms) {
            if (text.title.includes(term)) score += WEIGHT.title;
            else if (text.keyword.includes(term)) score += WEIGHT.keyword;
            else if (text.body.includes(term)) score += WEIGHT.body;
            else return;
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
