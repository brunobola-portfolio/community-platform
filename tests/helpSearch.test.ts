import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HELP_TUTORIALS, getCategory, tutorialsFor } from '../content/help';
import { editDistance, fillTokens, queryTerms, relatedTutorials, searchHelp, stem, tutorialsForTab } from '../content/help/search';
import type { HelpTutorial } from '../content/help';

const tutorial = (id: string, title: string, extra: Partial<HelpTutorial> = {}): HelpTutorial => ({
    id, title, category: 'eventos', summary: '', recap: '', minutes: 1, audience: 'direcao', steps: [{ text: '' }], keywords: [], ...extra,
});

describe('searchHelp', () => {
    const list = [
        tutorial('a', 'Publicar um evento', { keywords: ['agenda'] }),
        tutorial('b', 'Confirmar inscrições', { steps: [{ text: 'Abra o evento e confirme.' }] }),
        tutorial('c', 'Registar sócios e quotas'),
    ];

    it('ignores accents and case', () => {
        expect(searchHelp(list, 'INSCRICOES').map(t => t.id)).toEqual(['b']);
        expect(searchHelp(list, 'sócio').map(t => t.id)).toEqual(['c']);
    });

    it('ranks a title hit above a hit buried in the steps', () => {
        expect(searchHelp(list, 'evento').map(t => t.id)).toEqual(['a', 'b']);
    });

    it('requires every meaningful word, so more words narrow the results', () => {
        expect(searchHelp(list, 'confirmar evento').map(t => t.id)).toEqual(['b']);
        expect(searchHelp(list, 'evento quotas')).toEqual([]);
    });

    it('forgives one typo and a swapped pair of letters', () => {
        expect(searchHelp(list, 'inscriçoes').map(t => t.id)).toEqual(['b']);
        expect(searchHelp(list, 'inscirções').map(t => t.id)).toEqual(['b']);
        expect(searchHelp(list, 'socois').map(t => t.id)).toEqual(['c']);
    });

    it('matches word prefixes and plurals', () => {
        expect(searchHelp(list, 'inscr').map(t => t.id)).toEqual(['b']);
        expect(searchHelp(list, 'eventos').map(t => t.id)).toEqual(['a', 'b']);
        expect(searchHelp(list, 'quota').map(t => t.id)).toEqual(['c']);
    });

    it('does not guess on short words', () => {
        expect(searchHelp(list, 'xyz')).toEqual([]);
    });

    it('ignores the bold markers in the copy', () => {
        const bold = [tutorial('d', 'Guia', { steps: [{ text: 'Carregue em **Lista para a porta**.' }] })];
        expect(searchHelp(bold, 'lista porta').map(t => t.id)).toEqual(['d']);
    });

    it('drops stopwords instead of matching everything', () => {
        expect(queryTerms('como é que faço a inscrição')).toEqual(['inscricao']);
        expect(searchHelp(list, 'como de')).toEqual([]);
    });
});

describe('stem and editDistance', () => {
    it('folds common pt-PT plurals', () => {
        expect(stem('inscricoes')).toBe('inscricao');
        expect(stem('quotas')).toBe('quota');
        expect(stem('jornais')).toBe('jornal');
    });

    it('counts a transposition as one edit', () => {
        expect(editDistance('cartaz', 'catraz')).toBe(1);
        expect(editDistance('quota', 'quota')).toBe(0);
        expect(editDistance('abc', '')).toBe(3);
    });
});

describe('relatedTutorials', () => {
    const list = [
        tutorial('a', 'A', { related: ['c', 'missing'] }),
        tutorial('b', 'B'),
        tutorial('c', 'C', { category: 'socios' }),
    ];

    it('uses the explicit list and skips unknown ids', () => {
        expect(relatedTutorials(list, list[0]).map(t => t.id)).toEqual(['c']);
    });

    it('falls back to the rest of the category', () => {
        expect(relatedTutorials(list, list[1]).map(t => t.id)).toEqual(['a']);
    });
});

describe('fillTokens', () => {
    it('replaces every {siteName}', () => {
        expect(fillTokens('A {siteName} e a {siteName}', { siteName: 'ACR' })).toBe('A ACR e a ACR');
    });
});

describe('tutorialsForTab', () => {
    it('lists the tutorials of the tab before the related ones', () => {
        const list = [tutorial('rel', 'R', { tab: 'ai', relatedTabs: ['events'] }), tutorial('own', 'O', { tab: 'events' })];
        expect(tutorialsForTab(list, 'events').map(t => t.id)).toEqual(['own', 'rel']);
    });
});

describe('help content', () => {
    it('has unique ids', () => {
        const ids = HELP_TUTORIALS.map(t => t.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('files each tutorial under a category of the same audience', () => {
        for (const t of HELP_TUTORIALS) expect(getCategory(t.category)?.audience, t.id).toBe(t.audience);
    });

    it('gives the public page something to show', () => {
        expect(tutorialsFor('socio').length).toBeGreaterThan(0);
    });

    it('points only at media that exists in public/', () => {
        const paths = HELP_TUTORIALS.flatMap(t => t.media ?? []).flatMap(m => (m.kind === 'video' ? [m.src, m.poster] : [m.src]));
        const missing = paths.filter(p => !existsSync(join(process.cwd(), 'public', p)));
        expect(missing).toEqual([]);
    });
});
