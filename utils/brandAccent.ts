/**
 * Accent colour: the second voice of a brand guide (e.g. a gold next to a red).
 *
 * It only decorates — the end stop of title gradients, glows, the founders
 * badge — so the raw colour lives at accent-500 untouched, and the steps that
 * may carry text are corrected like the brand: accent-600 reaches 3:1 on the
 * light page (large gradient text), accent-700 4.5:1, and accent-400 4.5:1 on
 * the dark surfaces.
 */

import { contrastRatio, hexToRgb, normalizeHex, rgbToHex } from './color';
import type { Rgb } from './color';
import { SCALE_STEPS, darkFloor, enforceDarkerDown, enforceLighterUp, keepOrPush, ladder, pushToContrast, scaleVariables, shadeLightness, shadesFrom700 } from './colorScale';
import type { Scale } from './colorScale';
import { darkSurfaces, deriveNeutralScale, lightSurfaces } from './brandNeutrals';
import { AA_LARGE, AA_TEXT, brandBase } from './brandPalette';
import { hueDistance, oklchToRgb, rgbToOklch } from './oklch';

/**
 * Platform accent when an instance sets none: a warm gold sits well next to
 * almost any brand hue (reds, blues, greens, purples) and was the accent the
 * site shipped with, so existing instances look the same.
 */
export const DEFAULT_ACCENT_COLOR = '#fbbf24';

const GOLD_HUE = rgbToOklch(hexToRgb(DEFAULT_ACCENT_COLOR)).h;
// A brand within this hue distance of gold, and coloured enough to have a
// hue, would swallow a gold accent (yellow, amber, orange brands)
const CLASH_HUE = 35;
const CLASH_CHROMA = 0.08;
// For those brands the accent moves this far round the wheel towards red: a
// yellow gets coral, an amber a rose. A true complement (blue for yellow)
// was tried and rejected: brand→accent title gradients run through grey in
// the middle, while an analogous warm pair stays clean
const ANALOGOUS_SHIFT = -55;
const ANALOGOUS_L = 0.68;
const ANALOGOUS_C = 0.16;
// OKLab distance under which brand and accent are effectively the same colour
const SAME_COLOUR_DE = 0.06;

/** Accent for an instance that set none: gold, or a warm analogous colour when the brand itself is gold-like. */
export function autoAccentColor(brand: string | null | undefined): string {
  const lch = rgbToOklch(brandBase(brand));
  if (lch.c < CLASH_CHROMA || hueDistance(lch.h, GOLD_HUE) > CLASH_HUE) return DEFAULT_ACCENT_COLOR;
  return rgbToHex(oklchToRgb({ l: ANALOGOUS_L, c: ANALOGOUS_C, h: (lch.h + ANALOGOUS_SHIFT + 360) % 360 }));
}

/** The accent to apply: the stored one when valid, otherwise the automatic choice. */
export function resolveAccentColor(brand: string | null | undefined, accent: string | null | undefined): string {
  return normalizeHex(accent) ?? autoAccentColor(brand);
}

/** Accent 50…950 around the raw colour at 500, corrected for the surfaces of this brand's theme. */
export function deriveAccentScale(accent: string, brand: string | null | undefined): Scale {
  const raw = hexToRgb(resolveAccentColor(brand, accent));
  const neutrals = deriveNeutralScale(brandBase(brand));
  const target = ladder(rgbToOklch(raw), 500);
  const scale = {} as Scale;
  for (const step of SCALE_STEPS) scale[step] = step === 500 ? raw : oklchToRgb(target[step]);

  scale[600] = pushToContrast(target[600], -1, lightSurfaces(neutrals), AA_LARGE);
  const lch600 = rgbToOklch(scale[600]);
  scale[700] = pushToContrast({ ...lch600, l: shadeLightness(lch600.l, 1) }, -1, lightSurfaces(neutrals), AA_TEXT);
  shadesFrom700(scale, target, darkFloor(lch600.l));
  enforceDarkerDown(scale, 700);

  scale[400] = keepOrPush(scale[400], 1, darkSurfaces(neutrals), AA_TEXT);
  enforceLighterUp(scale, 400);
  return scale;
}

export function accentCssVariables(accent: string, brand: string | null | undefined): Record<string, string> {
  return scaleVariables('accent', deriveAccentScale(accent, brand));
}

function oklabDistance(a: Rgb, b: Rgb): number {
  const la = rgbToOklch(a);
  const lb = rgbToOklch(b);
  const rad = Math.PI / 180;
  const da = la.c * Math.cos(la.h * rad) - lb.c * Math.cos(lb.h * rad);
  const db = la.c * Math.sin(la.h * rad) - lb.c * Math.sin(lb.h * rad);
  return Math.hypot(la.l - lb.l, da, db);
}

export interface AccentContrastReport {
  /** accent-600 (gradient end in the light theme) on the light page. */
  light600: number;
  /** accent-400 (gradient end and text in the dark theme) on the dark surfaces. */
  dark400: number;
  /** The raw accent on the dark background, for information. */
  baseOnDark: number;
  /** True when the accent is indistinguishable from the brand colour. */
  sameAsBrand: boolean;
  /** True when no accent is stored and the automatic one is used. */
  automatic: boolean;
}

export function accentContrastReport(brand: string | null | undefined, accent: string | null | undefined): AccentContrastReport {
  const resolved = resolveAccentColor(brand, accent);
  const neutrals = deriveNeutralScale(brandBase(brand));
  const scale = deriveAccentScale(resolved, brand);
  const worst = (c: Rgb, bgs: readonly Rgb[]) => Math.min(...bgs.map((bg) => contrastRatio(c, bg)));
  return {
    light600: worst(scale[600], lightSurfaces(neutrals)),
    dark400: worst(scale[400], darkSurfaces(neutrals)),
    baseOnDark: worst(hexToRgb(resolved), darkSurfaces(neutrals)),
    sameAsBrand: oklabDistance(hexToRgb(resolved), brandBase(brand)) < SAME_COLOUR_DE,
    automatic: normalizeHex(accent) === null,
  };
}
