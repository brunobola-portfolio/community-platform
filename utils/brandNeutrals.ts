/**
 * Brand-tinted neutrals.
 *
 * Tailwind's `slate` is a cool blue-grey; under a warm brand (red, orange) it
 * reads as an unrelated navy theme. Every `slate-*` class and the dark
 * surfaces are remapped to this scale, which keeps slate's exact WCAG
 * luminance per step (so every audited text/background pair keeps its ratio)
 * but borrows the brand hue at low chroma: warm near-blacks for red, cool for
 * indigo or teal, plain grey for an achromatic brand.
 */

import { relativeLuminance } from './color';
import type { Rgb } from './color';
import { SCALE_STEPS, scaleVariables } from './colorScale';
import type { Scale } from './colorScale';
import { oklchToRgb, rgbToOklch } from './oklch';

/** Tailwind v3 slate, the reference the site was audited against. */
export const SLATE: Scale = {
  50: [248, 250, 252],
  100: [241, 245, 249],
  200: [226, 232, 240],
  300: [203, 213, 225],
  400: [148, 163, 184],
  500: [100, 116, 139],
  600: [71, 85, 105],
  700: [51, 65, 85],
  800: [30, 41, 59],
  900: [15, 23, 42],
  950: [2, 6, 23],
};

// Share of slate's own chroma the tint may use: slate peaks around 0.046,
// which is already a visible blue, and that much chroma in a warm hue reads
// as brown rather than neutral
const TINT_STRENGTH = 0.45;
// Brand chroma below which the brand is a grey (no hue worth borrowing) and
// above which it gets the full tint; in between the tint fades in linearly
const GREY_CHROMA = 0.03;
const VIVID_CHROMA = 0.12;

/** 0 for greys/black/white, up to 1 for clearly coloured brands. */
export function neutralTintAmount(brand: Rgb): number {
  const { c } = rgbToOklch(brand);
  return Math.min(1, Math.max(0, (c - GREY_CHROMA) / (VIVID_CHROMA - GREY_CHROMA)));
}

/** Colour of chroma `c` and hue `h` whose WCAG luminance equals `target` (bisection on lightness). */
function matchLuminance(c: number, h: number, target: number): Rgb {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (relativeLuminance(oklchToRgb({ l: mid, c, h })) < target) lo = mid;
    else hi = mid;
  }
  return oklchToRgb({ l: (lo + hi) / 2, c, h });
}

/** Neutral 50…950 tinted with the brand hue, luminance-matched to slate step by step. */
export function deriveNeutralScale(brand: Rgb): Scale {
  const amount = neutralTintAmount(brand);
  const hue = rgbToOklch(brand).h;
  const scale = {} as Scale;
  for (const step of SCALE_STEPS) {
    const slate = SLATE[step];
    const c = rgbToOklch(slate).c * TINT_STRENGTH * amount;
    scale[step] = matchLuminance(c, hue, relativeLuminance(slate));
  }
  return scale;
}

/** Surfaces brand text is read against in the dark theme (dark-bg, dark-surface). */
export function darkSurfaces(neutrals: Scale): readonly Rgb[] {
  return [neutrals[950], neutrals[900]];
}

/** Surfaces brand text is read against in the light theme (cards, page background). */
export function lightSurfaces(neutrals: Scale): readonly Rgb[] {
  return [[255, 255, 255], neutrals[50]];
}

export function neutralCssVariables(neutrals: Scale): Record<string, string> {
  return scaleVariables('neutral', neutrals);
}
