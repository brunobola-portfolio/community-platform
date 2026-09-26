import { describe, expect, it } from 'vitest';
import { EXCERPT_LENGTH, toExcerpt } from '../convex/lib/text';
import { eventSummaryText, isLeadRedundant, normalize, plainTextToHtml, progressWidthClass, slugify } from '../utils/text';
import { fitWithin, MAX_EDGE, renamed } from '../utils/imageOptimize';

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


describe('image optimisation sizing', () => {
  it('shrinks a phone photo to the long edge, keeping its shape', () => {
    expect(fitWithin(3024, 4032)).toEqual({ width: 1500, height: MAX_EDGE });
    expect(fitWithin(4000, 3000)).toEqual({ width: MAX_EDGE, height: 1500 });
  });

  it('never enlarges an image that is already small', () => {
    expect(fitWithin(800, 1131)).toEqual({ width: 800, height: 1131 });
  });

  it('names the file after the format it was re-encoded to', () => {
    expect(renamed('Cartaz Arraial.HEIC', 'image/jpeg')).toBe('Cartaz Arraial.jpg');
    expect(renamed('logo.webp', 'image/png')).toBe('logo.png');
    expect(renamed('.png', 'image/jpeg')).toBe('imagem.jpg');
  });
});

describe('plainTextToHtml', () => {
  it('keeps the paragraphs text was written in', () => {
    expect(plainTextToHtml('Primeiro.\n\nSegundo.')).toBe('<p>Primeiro.</p><p>Segundo.</p>');
  });

  it('keeps a single line break as a break, as a WhatsApp message has it', () => {
    expect(plainTextToHtml('Sábado\n21h00')).toBe('<p>Sábado<br>21h00</p>');
  });

  it('never lets pasted text become markup', () => {
    expect(plainTextToHtml('<img src=x onerror=alert(1)> & co')).toBe('<p>&lt;img src=x onerror=alert(1)&gt; &amp; co</p>');
  });

  it('treats Windows line endings like any other', () => {
    expect(plainTextToHtml('a\r\n\r\nb')).toBe('<p>a</p><p>b</p>');
  });
});

describe('isLeadRedundant', () => {
  it('hides a lead that is only the opening of the body', () => {
    expect(isLeadRedundant('Já pode reservar lugar.', '<p>Já pode reservar <b>lugar</b>.</p><p>Mais.</p>')).toBe(true);
    expect(isLeadRedundant('Já pode reservar lugar na sardinhada…', '<p>Já pode reservar lugar na sardinhada do arraial.</p>')).toBe(true);
  });

  it('keeps a lead someone wrote on purpose', () => {
    expect(isLeadRedundant('Um verão para lembrar.', '<p>Já pode reservar lugar.</p>')).toBe(false);
    expect(isLeadRedundant('', '<p>Texto</p>')).toBe(false);
  });
});
