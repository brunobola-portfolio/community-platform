import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BRAND_STEPS,
  DEFAULT_BRAND_COLOR,
  brandContrastReport,
  brandCssVariables,
  contrastRatio,
  deriveBrandPalette,
  normalizeHex,
  relativeLuminance,
  rgbToHex,
} from '../utils/brandPalette';
import type { Rgb } from '../utils/brandPalette';
import { BODY_FONTS, DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT, HEADING_FONTS, googleFontsHref, resolveFont } from '../utils/brandFonts';

const WHITE: Rgb = [255, 255, 255];
const DARK_SURFACE: Rgb = [15, 23, 42];

// Light, dark, saturated and near-neutral picks: the ones that used to break
// a hand-tuned scale (yellow on white, navy on the dark surface)
const SAMPLES = ['#4f46e5', '#eab308', '#facc15', '#22d3ee', '#84cc16', '#1e3a8a', '#7f1d1d', '#ffffff', '#000000', '#808080', '#dc2626'];

describe('normalizeHex', () => {
  it('accepts 3 and 6 digit colours with or without the hash', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('4F46E5')).toBe('#4f46e5');
  });

  it('rejects anything else', () => {
    for (const bad of ['', 'red', '#12345', '#ggggggg', 'rgb(0,0,0)', undefined, null]) {
      expect(normalizeHex(bad)).toBeNull();
    }
  });
});

describe('deriveBrandPalette', () => {
  it('falls back to the platform default on invalid input', () => {
    expect(deriveBrandPalette('not-a-colour')).toEqual(deriveBrandPalette(DEFAULT_BRAND_COLOR));
    expect(deriveBrandPalette('')).toEqual(deriveBrandPalette(DEFAULT_BRAND_COLOR));
  });

  it('keeps a colour that already passes as brand-600', () => {
    expect(rgbToHex(deriveBrandPalette('#4f46e5')[600])).toBe('#4f46e5');
  });

  it.each(SAMPLES)('keeps the AA guarantees for %s', (hex) => {
    const p = deriveBrandPalette(hex);
    // White text on brand-700 and brand-700 text on white are the same ratio
    expect(contrastRatio(p[700], WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p[700], p[100])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p[600], WHITE)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(p[400], DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SAMPLES)('stays ordered light to dark for %s', (hex) => {
    const p = deriveBrandPalette(hex);
    for (let i = 1; i < BRAND_STEPS.length; i++) {
      expect(relativeLuminance(p[BRAND_STEPS[i]])).toBeLessThanOrEqual(relativeLuminance(p[BRAND_STEPS[i - 1]]));
    }
  });

  it('darkens a light colour and says so', () => {
    const report = brandContrastReport('#eab308');
    expect(report.baseOnWhite).toBeLessThan(3);
    expect(report.adjusted).toBe(true);
    expect(report.largeOn600).toBeGreaterThanOrEqual(3);
  });
});

describe('brandCssVariables', () => {
  it('emits space-separated channels for every step', () => {
    const vars = brandCssVariables('#4f46e5');
    expect(Object.keys(vars)).toHaveLength(BRAND_STEPS.length);
    expect(vars['--brand-600']).toBe('79 70 229');
    for (const value of Object.values(vars)) expect(value).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
  });

  it('matches the first-paint defaults in index.css', () => {
    // index.css paints before any JS runs; drifting from the derived default
    // would flash a different shade the moment BrandTheme mounts
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    for (const [name, value] of Object.entries(brandCssVariables(DEFAULT_BRAND_COLOR))) {
      expect(css).toContain(`${name}: ${value};`);
    }
  });
});

describe('brand fonts', () => {
  it('resolves stored names case-insensitively and falls back otherwise', () => {
    expect(resolveFont(HEADING_FONTS, 'fraunces', DEFAULT_HEADING_FONT).family).toBe('Fraunces');
    expect(resolveFont(BODY_FONTS, 'Comic Sans', DEFAULT_BODY_FONT)).toBe(DEFAULT_BODY_FONT);
  });

  it('builds one stylesheet URL without duplicate families', () => {
    const href = googleFontsHref([DEFAULT_BODY_FONT, DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT]);
    expect(href.match(/family=/g)).toHaveLength(2);
    expect(href).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?.+&display=swap$/);
  });

  it('keeps the static index.html link equal to the defaults', () => {
    // BrandTheme skips its own link when the defaults are chosen, trusting this one
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(html).toContain(googleFontsHref([DEFAULT_BODY_FONT, DEFAULT_HEADING_FONT]));
  });
});
