/**
 * Brand palette derivation.
 *
 * Each instance picks ONE colour in the backoffice; the whole `brand-50…950`
 * scale is derived from it at runtime and exposed as CSS variables holding
 * space-separated RGB channels, so Tailwind's `rgb(var(--brand-500) / <alpha>)`
 * keeps opacity modifiers working.
 *
 * The scale is a ladder in OKLCH around the chosen colour at step 600 (hue
 * fixed, chroma shaped per step like Tailwind's palettes), so tints of a red
 * stay red instead of turning pink. The site was audited against WCAG AA with
 * fixed shades doing fixed jobs (white text on brand-700, brand-700 text on
 * light, brand-400 text on dark); an arbitrary colour cannot be trusted to keep
 * those promises, so every load-bearing step is then nudged until it does.
 */

import { WHITE, alphaBlend, contrastRatio, hexToRgb, normalizeHex, rgbToHex } from './color';
import type { Rgb } from './color';
import { SCALE_STEPS, darkFloor, enforceDarkerDown, enforceLighterUp, keepOrPush, ladder, pushToContrast, scaleVariables, shadeLightness, shadesFrom700 } from './colorScale';
import type { Scale, ScaleStep } from './colorScale';
import { darkSurfaces, deriveNeutralScale, lightSurfaces } from './brandNeutrals';
import { oklchToRgb, rgbToOklch } from './oklch';

export { contrastRatio, hexToRgb, normalizeHex, relativeLuminance, rgbToHex, toChannels } from './color';
export type { Rgb } from './color';

export const DEFAULT_BRAND_COLOR = '#4f46e5';

export const BRAND_STEPS = SCALE_STEPS;
export type BrandStep = ScaleStep;
export type BrandPalette = Scale;

// Small headroom above the WCAG thresholds absorbs rounding and the slight
// tint that `bg-brand-500/10` badges put behind brand text
export const AA_TEXT = 4.6;
export const AA_LARGE = 3.05;

/** The chosen colour as RGB; invalid input uses the platform default. */
export function brandBase(input: string | null | undefined): Rgb {
  return hexToRgb(normalizeHex(input) ?? DEFAULT_BRAND_COLOR);
}

/** Derives the full brand scale from one hex colour (invalid input uses the platform default). */
export function deriveBrandPalette(input: string | null | undefined): BrandPalette {
  const base = brandBase(input);
  const neutrals = deriveNeutralScale(base);
  const target = ladder(rgbToOklch(base), 600);
  const palette = {} as Scale;
  for (const step of BRAND_STEPS) palette[step] = oklchToRgb(target[step]);

  // Light theme: buttons and links. brand-700 carries body-size text both ways
  // (white on it, it on white or a faint brand tint); brand-600 large text only
  palette[600] = keepOrPush(base, -1, [WHITE], AA_LARGE);
  const lch600 = rgbToOklch(palette[600]);
  const planned700 = { ...lch600, l: shadeLightness(lch600.l, 1), c: lch600.c * 0.92 };
  palette[700] = pushToContrast(planned700, -1, [WHITE, palette[100]], AA_TEXT);
  shadesFrom700(palette, target, darkFloor(lch600.l));
  enforceDarkerDown(palette);

  // Dark theme: brand-400 is the text colour on dark surfaces (also over the
  // brand-500/15 tint of badges), and very dark brand colours would sink
  const surfaces = darkSurfaces(neutrals);
  const tinted = surfaces.map((s) => alphaBlend(s, palette[500], 0.15));
  palette[400] = keepOrPush(palette[400], 1, [...surfaces, ...tinted], AA_TEXT);
  enforceLighterUp(palette, 400);
  return palette;
}

export interface BrandDisplay {
  /** Large display accents in the light theme: brand-600, darkened only if the page background needs it. */
  light: Rgb;
  /** Large display accents in the dark theme: the chosen colour itself when it reaches 3:1, otherwise lightened. */
  dark: Rgb;
}

/**
 * Colour for large display accents (hero words, page-title gradients).
 * Large text only needs 3:1, so unlike brand-400 (lifted to 4.5:1 for body
 * text, which turns a red into salmon) the dark variant keeps the exact brand
 * colour whenever it can.
 */
export function deriveBrandDisplay(input: string | null | undefined, palette: BrandPalette = deriveBrandPalette(input)): BrandDisplay {
  const base = brandBase(input);
  const neutrals = deriveNeutralScale(base);
  return {
    light: keepOrPush(palette[600], -1, lightSurfaces(neutrals), AA_LARGE),
    dark: keepOrPush(base, 1, darkSurfaces(neutrals), AA_LARGE),
  };
}

/** CSS custom properties `--brand-50…950` and the two display variants. */
export function brandCssVariables(input: string | null | undefined): Record<string, string> {
  const palette = deriveBrandPalette(input);
  const display = deriveBrandDisplay(input, palette);
  return {
    ...scaleVariables('brand', palette),
    '--brand-display-light': display.light.join(' '),
    '--brand-display-dark': display.dark.join(' '),
  };
}

export interface BrandContrastReport {
  /** Chosen colour against white text, before any correction. */
  baseOnWhite: number;
  /** White text on brand-700 (equal to brand-700 text on white). */
  textOn700: number;
  /** White large text on brand-600. */
  largeOn600: number;
  /** brand-400 text on the dark surface. */
  darkText400: number;
  /** Display accent on the dark background (large text). */
  displayDark: number;
  /** Display accent on the light page background (large text). */
  displayLight: number;
  /** True when the derived brand-600 had to be darkened to keep AA. */
  adjusted: boolean;
  /** True when the dark display accent had to be lightened. */
  displayAdjusted: boolean;
}

/** Contrast figures for the backoffice indicator (worst case over the relevant surfaces). */
export function brandContrastReport(input: string | null | undefined): BrandContrastReport {
  const base = brandBase(input);
  const neutrals = deriveNeutralScale(base);
  const p = deriveBrandPalette(input);
  const display = deriveBrandDisplay(input, p);
  const worst = (c: Rgb, bgs: readonly Rgb[]) => Math.min(...bgs.map((bg) => contrastRatio(c, bg)));
  return {
    baseOnWhite: contrastRatio(base, WHITE),
    textOn700: contrastRatio(p[700], WHITE),
    largeOn600: contrastRatio(p[600], WHITE),
    darkText400: worst(p[400], darkSurfaces(neutrals)),
    displayDark: worst(display.dark, darkSurfaces(neutrals)),
    displayLight: worst(display.light, lightSurfaces(neutrals)),
    adjusted: rgbToHex(p[600]) !== rgbToHex(base),
    displayAdjusted: rgbToHex(display.dark) !== rgbToHex(base),
  };
}
