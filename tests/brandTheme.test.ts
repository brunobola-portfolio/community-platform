import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCALE_STEPS } from '../utils/colorScale';
import { contrastRatio, hexToRgb, relativeLuminance, rgbToHex } from '../utils/color';
import type { Rgb } from '../utils/color';
import { SLATE, darkSurfaces, deriveNeutralScale, lightSurfaces } from '../utils/brandNeutrals';
import { brandContrastReport, deriveBrandDisplay } from '../utils/brandPalette';
import { DEFAULT_ACCENT_COLOR, accentContrastReport, autoAccentColor, deriveAccentScale, resolveAccentColor } from '../utils/brandAccent';
import { BODY_FONTS, DEFAULT_MONO_FONT, HEADING_FONTS, MONO_FONTS, fontStack } from '../utils/brandFonts';
import { brandThemeVariables, extraFonts, parseCachedBrand, resolveBrand, serializeBrand } from '../utils/brandTheme';
import { hueDistance, rgbToOklch } from '../utils/oklch';

const WHITE: Rgb = [255, 255, 255];
const BRANDS = ['#000000', '#ffffff', '#808080', '#ffff00', '#0000ff', '#00ff00', '#df3d32', '#4f46e5', '#0f766e', '#eab308', '#111111'];
const worst = (c: Rgb, bgs: readonly Rgb[]) => Math.min(...bgs.map((bg) => contrastRatio(c, bg)));

describe('brand-tinted neutrals', () => {
  it.each(BRANDS)('keeps slate luminance step by step for %s', (hex) => {
    const n = deriveNeutralScale(hexToRgb(hex));
    for (const step of SCALE_STEPS) {
      // Same contrast against white and against the darkest step as slate had
      expect(Math.abs(contrastRatio(n[step], WHITE) - contrastRatio(SLATE[step], WHITE))).toBeLessThan(0.15);
      expect(Math.abs(contrastRatio(n[step], n[950]) - contrastRatio(SLATE[step], SLATE[950]))).toBeLessThan(0.25);
    }
  });

  it.each(BRANDS)('keeps the body text pairs AA for %s', (hex) => {
    const n = deriveNeutralScale(hexToRgb(hex));
    expect(contrastRatio(n[500], WHITE)).toBeGreaterThanOrEqual(4.5); // text-slate-500 on cards
    expect(contrastRatio(n[600], WHITE)).toBeGreaterThanOrEqual(4.5); // text-slate-600 on white
    expect(contrastRatio(n[600], n[50])).toBeGreaterThanOrEqual(4.5); // …on the light page
    expect(contrastRatio(n[400], n[950])).toBeGreaterThanOrEqual(4.5); // text-slate-400 on dark-bg
    expect(contrastRatio(n[400], n[900])).toBeGreaterThanOrEqual(4.5); // …on dark-surface
    expect(contrastRatio(n[300], n[900])).toBeGreaterThanOrEqual(4.5);
  });

  it('falls back to pure grey for achromatic brands', () => {
    for (const hex of ['#000000', '#ffffff', '#808080', '#111111']) {
      for (const [r, g, b] of Object.values(deriveNeutralScale(hexToRgb(hex)))) {
        expect(r).toBe(g);
        expect(g).toBe(b);
      }
    }
  });

  it('warms the neutrals for a red brand and cools them for indigo', () => {
    const red = deriveNeutralScale(hexToRgb('#df3d32'))[900];
    const indigo = deriveNeutralScale(hexToRgb('#4f46e5'))[900];
    expect(red[0]).toBeGreaterThan(red[2]);
    expect(indigo[2]).toBeGreaterThan(indigo[0]);
    // Low chroma: still a neutral, not a brand colour
    expect(rgbToOklch(red).c).toBeLessThan(0.03);
  });
});

describe('display token', () => {
  it.each(BRANDS)('reaches 3:1 for large text in both themes for %s', (hex) => {
    const neutrals = deriveNeutralScale(hexToRgb(hex));
    const d = deriveBrandDisplay(hex);
    expect(worst(d.dark, darkSurfaces(neutrals))).toBeGreaterThanOrEqual(3);
    expect(worst(d.light, lightSurfaces(neutrals))).toBeGreaterThanOrEqual(3);
  });

  it('keeps the exact brand colour on dark when it already passes', () => {
    expect(rgbToHex(deriveBrandDisplay('#df3d32').dark)).toBe('#df3d32');
    expect(brandContrastReport('#df3d32').displayAdjusted).toBe(false);
  });

  it('lightens a dark brand in the same hue', () => {
    const d = deriveBrandDisplay('#1e3a8a');
    expect(hueDistance(rgbToOklch(d.dark).h, rgbToOklch(hexToRgb('#1e3a8a')).h)).toBeLessThan(6);
    expect(brandContrastReport('#1e3a8a').displayAdjusted).toBe(true);
  });
});

describe('accent colour', () => {
  it('defaults to gold, and to a warm analogous colour for gold-like brands', () => {
    expect(autoAccentColor('#df3d32')).toBe(DEFAULT_ACCENT_COLOR);
    expect(autoAccentColor('#4f46e5')).toBe(DEFAULT_ACCENT_COLOR);
    expect(autoAccentColor('#111111')).toBe(DEFAULT_ACCENT_COLOR);
    const forYellow = autoAccentColor('#eab308');
    expect(forYellow).not.toBe(DEFAULT_ACCENT_COLOR);
    expect(hueDistance(rgbToOklch(hexToRgb(forYellow)).h, rgbToOklch(hexToRgb('#eab308')).h)).toBeGreaterThan(40);
  });

  it('uses a stored accent and ignores invalid ones', () => {
    expect(resolveAccentColor('#df3d32', '#FBBF24')).toBe('#fbbf24');
    expect(resolveAccentColor('#df3d32', 'gold')).toBe(DEFAULT_ACCENT_COLOR);
    expect(resolveAccentColor('#df3d32', '')).toBe(DEFAULT_ACCENT_COLOR);
  });

  const ACCENTS = ['#fbbf24', '#fffbeb', '#ffffff', '#1a0f00', '#000000', '#df3d32', '#0000ff', '#2dd4bf'];
  it.each(ACCENTS)('keeps its guarantees for accent %s (brand #df3d32)', (accent) => {
    const brand = '#df3d32';
    const neutrals = deriveNeutralScale(hexToRgb(brand));
    const a = deriveAccentScale(accent, brand);
    expect(rgbToHex(a[500])).toBe(accent);
    expect(worst(a[600], lightSurfaces(neutrals))).toBeGreaterThanOrEqual(3);
    expect(worst(a[700], lightSurfaces(neutrals))).toBeGreaterThanOrEqual(4.5);
    expect(worst(a[400], darkSurfaces(neutrals))).toBeGreaterThanOrEqual(4.5);
    for (let i = 1; i < SCALE_STEPS.length; i++) {
      expect(relativeLuminance(a[SCALE_STEPS[i]])).toBeLessThanOrEqual(relativeLuminance(a[SCALE_STEPS[i - 1]]) + 1e-9);
    }
  });

  it('flags an accent equal to the brand and the automatic choice', () => {
    expect(accentContrastReport('#df3d32', '#df3d32').sameAsBrand).toBe(true);
    expect(accentContrastReport('#df3d32', '#fbbf24').sameAsBrand).toBe(false);
    expect(accentContrastReport('#df3d32', '').automatic).toBe(true);
    expect(accentContrastReport('#df3d32', '#fbbf24').automatic).toBe(false);
  });
});

describe('resolved brand', () => {
  it('falls back field by field on invalid input', () => {
    const brand = resolveBrand({ color: 'red', accent: '#12', heading: 'Comic Sans', body: undefined, mono: 'Courier' });
    expect(brand.color).toBe('#4f46e5');
    expect(brand.accent).toBe(DEFAULT_ACCENT_COLOR);
    expect(brand.heading).toBe(HEADING_FONTS[0]);
    expect(brand.body).toBe(BODY_FONTS[0]);
    expect(brand.mono).toBe(DEFAULT_MONO_FONT);
  });

  it('gives every curated font a generic fallback for when Google Fonts is unreachable', () => {
    for (const f of HEADING_FONTS) expect(fontStack(f)).toMatch(/serif$/);
    for (const f of BODY_FONTS) expect(fontStack(f)).toMatch(/sans-serif$/);
    for (const f of MONO_FONTS) expect(fontStack(f)).toMatch(/monospace$/);
  });

  it('loads only fonts the static link does not', () => {
    expect(extraFonts(resolveBrand({}))).toEqual([]);
    const brand = resolveBrand({ mono: 'JetBrains Mono', heading: 'Fraunces' });
    expect(extraFonts(brand).map((f) => f.family)).toEqual(['JetBrains Mono', 'Fraunces']);
  });

  it('matches every first-paint default in index.css', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    for (const [name, value] of Object.entries(brandThemeVariables(resolveBrand({})))) {
      expect(css).toContain(`${name}: ${value};`);
    }
  });
});

describe('cached brand (applied before settings arrive)', () => {
  it('round-trips through storage', () => {
    const brand = resolveBrand({ color: '#df3d32', accent: '#fbbf24', heading: 'Playfair Display', body: 'Geist', mono: 'Geist Mono' });
    expect(parseCachedBrand(serializeBrand(brand))).toEqual(brand);
  });

  it('reads a cache written by an older release (no accent, no mono)', () => {
    const old = parseCachedBrand(JSON.stringify({ color: '#df3d32', heading: 'Fraunces', body: 'Inter' }));
    expect(old?.color).toBe('#df3d32');
    expect(old?.heading.family).toBe('Fraunces');
    expect(old?.accent).toBe(DEFAULT_ACCENT_COLOR);
    expect(old?.mono).toBe(DEFAULT_MONO_FONT);
  });

  it('ignores missing or corrupted storage', () => {
    for (const raw of [null, '', 'not json', '42', 'null', '"text"']) expect(parseCachedBrand(raw)).toBeNull();
    expect(parseCachedBrand(JSON.stringify({ color: 12 }))?.color).toBe('#4f46e5');
  });
});
