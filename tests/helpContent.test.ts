import { describe, expect, it } from 'vitest';
import { HELP_TUTORIALS, getTutorial } from '../content/help';
import { boldSegments, helpLink, plainText, wordCount } from '../content/help/format';
import { parseDone, toggleDone } from '../content/help/progress';

describe('guide writing rules', () => {
    it('keeps every step to one short action (20 words or fewer)', () => {
        const long = HELP_TUTORIALS.flatMap(t => t.steps.filter(s => wordCount(s.text) > 20).map(s => `${t.id}: ${s.text}`));
        expect(long).toEqual([]);
    });

    it('gives every guide an "Em resumo" line', () => {
        expect(HELP_TUTORIALS.filter(t => !t.recap.trim()).map(t => t.id)).toEqual([]);
    });

    it('closes every bold marker', () => {
        const texts = HELP_TUTORIALS.flatMap(t => [t.recap, ...t.steps.flatMap(s => [s.text, s.tip ?? '', s.why ?? '', s.warning ?? ''])]);
        expect(texts.filter(text => plainText(text).includes('*'))).toEqual([]);
    });

    it('points related guides only at guides of the same audience', () => {
        const broken = HELP_TUTORIALS.flatMap(t => (t.related ?? [])
            .filter(id => getTutorial(id)?.audience !== t.audience)
            .map(id => `${t.id} -> ${id}`));
        expect(broken).toEqual([]);
    });

    it('never names a real association', () => {
        const all = JSON.stringify(HELP_TUTORIALS).toLowerCase();
        expect(all).not.toContain('arcva');
    });
});

describe('format helpers', () => {
    it('splits bold markers into segments', () => {
        expect(boldSegments('Carregue em **Guardar** já')).toEqual([
            { text: 'Carregue em ', bold: false },
            { text: 'Guardar', bold: true },
            { text: ' já', bold: false },
        ]);
    });

    it('counts words without markers or punctuation', () => {
        expect(wordCount('Carregue em **Guardar alterações** — já.')).toBe(5);
    });

    it('builds an encoded deep link', () => {
        expect(helpLink('https://x.pt', '/ajuda', 'ajuda', 'a b')).toBe('https://x.pt/ajuda?ajuda=a%20b');
    });
});

describe('step progress parsing', () => {
    it('survives garbage and stale entries', () => {
        expect(parseDone(null, 3)).toEqual([]);
        expect(parseDone('not json', 3)).toEqual([]);
        expect(parseDone('{"a":1}', 3)).toEqual([]);
        expect(parseDone('[2, 0, 2, 7, -1, 1.5, "1"]', 3)).toEqual([0, 2]);
    });

    it('toggles a step on and off in order', () => {
        expect(toggleDone([2], 0)).toEqual([0, 2]);
        expect(toggleDone([0, 2], 2)).toEqual([0]);
    });
});
