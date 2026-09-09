import { describe, expect, it } from 'vitest';
import { EXCERPT_LENGTH, toExcerpt } from '../convex/lib/text';
import { eventSummaryText, normalize, progressWidthClass, slugify } from '../utils/text';

describe('toExcerpt', () => {
  it('returns a short body unchanged once tags are gone', () => {
    expect(toExcerpt('<p>Curto <strong>e</strong> simples.</p>')).toBe('Curto e simples.');
  });

  it('turns tags into spaces so adjacent blocks do not run together', () => {
    // Deleting the tags outright would read as "primeirosegundo"
    expect(toExcerpt('<p>primeiro</p><p>segundo</p>')).toBe('primeiro segundo');
  });

  it('truncates a long body and marks it as cut', () => {
    const excerpt = toExcerpt(`<p>${'palavra '.repeat(200)}</p>`);
    expect(excerpt.length).toBeLessThanOrEqual(EXCERPT_LENGTH + 1);
    expect(excerpt.endsWith('\u2026')).toBe(true);
  });

  it('does not leave a dangling space before the ellipsis', () => {
    expect(toExcerpt('a '.repeat(400))).not.toMatch(/ \u2026$/);
  });

  it('leaves entities encoded for the client sanitiser to resolve', () => {
    expect(toExcerpt('<p>Sopa &amp; pão</p>')).toBe('Sopa &amp; pão');
  });

  it('survives a body that is only markup', () => {
    expect(toExcerpt('<p></p><br/>')).toBe('');
  });
});

describe('eventSummaryText', () => {
  it('prefers the excerpt the public subscription carries', () => {
    expect(eventSummaryText({ excerpt: 'resumo', description: '<p>corpo</p>' })).toBe('resumo');
  });

  it('falls back to the body an admin session already holds', () => {
    expect(eventSummaryText({ description: '<p>corpo</p>' })).toBe('<p>corpo</p>');
  });

  it('never returns undefined, so search and exports keep working', () => {
    expect(eventSummaryText({})).toBe('');
    expect(eventSummaryText({ excerpt: '' , description: '' })).toBe('');
  });
});

describe('normalize', () => {
  it('matches accented Portuguese input against unaccented search terms', () => {
    expect(normalize('Comissão de São João')).toBe('comissao de sao joao');
  });
});

describe('slugify', () => {
  it('builds a URL-safe slug', () => {
    expect(slugify('  Torneio de Petanca 2026! ')).toBe('torneio-de-petanca-2026');
  });

  it('never returns empty, so a schema field stays valid', () => {
    expect(slugify('!!!')).toMatch(/^registo-\d+$/);
  });
});

describe('progressWidthClass', () => {
  it('only ever returns a class Tailwind compiled', () => {
    const allowed = new Set(['w-0', 'w-[10%]', 'w-[20%]', 'w-[30%]', 'w-[40%]', 'w-[50%]',
      'w-[60%]', 'w-[70%]', 'w-[80%]', 'w-[90%]', 'w-full']);
    for (const percent of [-50, 0, 1, 33.3, 50, 99.9, 100, 250, Number.NaN]) {
      expect(allowed.has(progressWidthClass(percent))).toBe(true);
    }
  });

  it('shows a sliver of progress rather than nothing for a first sign-up', () => {
    // 1 of 32 places is 3%: rounding to the nearest tenth would render an empty bar
    expect(progressWidthClass(3)).toBe('w-[10%]');
    expect(progressWidthClass(0)).toBe('w-0');
  });
});
