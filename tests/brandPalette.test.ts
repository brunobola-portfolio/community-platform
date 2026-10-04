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
import { BODY_FONTS, DEFAULT_BODY_FONT, DEFAULT_FONTS, DEFAULT_HEADING_FONT, HEADING_FONTS, googleFontsHref, resolveFont } from '../utils/brandFonts';
import { darkSurfaces, deriveNeutralScale } from '../utils/brandNeutrals';
import { hexToRgb } from '../utils/color';
import { rgbToOklch } from '../utils/oklch';

const WHITE: Rgb = [255, 255, 255];

// Light, dark, saturated and near-neutral picks: the ones that used to break
// a hand-tuned scale (yellow on white, navy on the dark surface), plus the
// primaries and the reference red
const SAMPLES = [
  '#4f46e5', '#eab308', '#facc15', '#22d3ee', '#84cc16', '#1e3a8a', '#7f1d1d', '#ffffff', '#000000', '#808080',
  '#dc2626', '#df3d32', '#ffff00', '#0000ff', '#00ff00', '#0f766e', '#111111',
];

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
    // Against this brand's own tinted dark surfaces, and the old slate ones
    for (const surface of [...darkSurfaces(deriveNeutralScale(hexToRgb(hex))), [15, 23, 42] as Rgb]) {
      expect(contrastRatio(p[400], surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(SAMPLES)('stays ordered light to dark for %s', (hex) => {
    const p = deriveBrandPalette(hex);
    for (let i = 1; i < BRAND_STEPS.length; i++) {
      expect(relativeLuminance(p[BRAND_STEPS[i]])).toBeLessThanOrEqual(relativeLuminance(p[BRAND_STEPS[i - 1]]));
    }
  });

  it('keeps the reference red red: tints stay coral, not pink', () => {
    // The old hand-tuned scale for this brand: 400 #ef7a70, 500 #e65649,
    // 800 #9a2820, 950 #45100c. The OKLCH ladder must land in the same family
    const p = deriveBrandPalette('#df3d32');
    const baseHue = rgbToOklch(hexToRgb('#df3d32')).h;
    for (const step of [400, 500, 800, 950] as const) {
      const { h } = rgbToOklch(p[step]);
      expect(Math.abs(h - baseHue)).toBeLessThan(8);
    }
    expect(rgbToHex(p[600])).toBe('#df3d32');
    // Close to the hand-tuned luminance per step (within ~15%)
    const reference = { 400: '#ef7a70', 500: '#e65649', 800: '#9a2820', 950: '#45100c' } as const;
    for (const [step, hex] of Object.entries(reference)) {
      const got = relativeLuminance(p[Number(step) as 400 | 500 | 800 | 950]);
      const want = relativeLuminance(hexToRgb(hex));
      expect(Math.abs(got - want) / want).toBeLessThan(0.3);
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
  it('emits space-separated channels for every step and both display variants', () => {
    const vars = brandCssVariables('#4f46e5');
    expect(Object.keys(vars)).toHaveLength(BRAND_STEPS.length + 2);
    expect(vars['--brand-600']).toBe('79 70 229');
    expect(vars['--brand-display-light']).toBeDefined();
    expect(vars['--brand-display-dark']).toBeDefined();
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
    expect(html).toContain(googleFontsHref(DEFAULT_FONTS));
  });
});
