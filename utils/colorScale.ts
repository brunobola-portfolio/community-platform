/**
 * Shared machinery for the 50…950 scales (brand and accent): an OKLCH
 * lightness/chroma ladder around an anchor step, plus the contrast nudges
 * that turn a pleasant ladder into one that keeps its accessibility promises.
 */

import { contrastRatio, relativeLuminance, toChannels } from './color';
import type { Rgb } from './color';
import { oklchToRgb, rgbToOklch } from './oklch';
import type { Oklch } from './oklch';

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];
export type Scale = Record<ScaleStep, Rgb>;

// Lightest tint the ladder aims for; pure white would make brand-50 vanish on white cards
const TOP_L = 0.985;
// Darkest shade; deeper than this reads as black and loses the hue entirely
const DARK_FLOOR = 0.16;
// By distance from the anchor (index 0 = one step away). The fractions and the
// chroma shape follow Tailwind's own palettes measured in OKLCH: tints lose
// chroma fast towards 50, shades keep most of it so hovers stay saturated
const LIGHT_FRACTIONS = [0.15, 0.33, 0.55, 0.75, 0.87, 0.94, 0.97];
const LIGHT_CHROMA = [0.94, 0.76, 0.5, 0.3, 0.15, 0.07, 0.04];
// Share of the anchor→floor lightness span each shade keeps
const DARK_POSITIONS = [0.83, 0.67, 0.53, 0.2, 0.1];
const DARK_CHROMA = [0.92, 0.82, 0.7, 0.5, 0.4];
// Lightness increment for the contrast walks: ~0.4% is below a visible step
const WALK = 0.004;

/** Lightness the ladder bottoms out at for a given anchor (dark anchors keep a proportional floor). */
export function darkFloor(anchorL: number): number {
  return Math.min(DARK_FLOOR, anchorL * 0.5);
}

/** Lightness of a shade `distance` steps below an anchor (1-based). */
export function shadeLightness(anchorL: number, distance: number): number {
  const floor = darkFloor(anchorL);
  const pos = DARK_POSITIONS[Math.min(distance, DARK_POSITIONS.length) - 1];
  return floor + (anchorL - floor) * pos;
}

// Shades below 700 sit on the span between the corrected 700 and the floor,
// at these shares, so hovers stay visibly darker even after a light colour
// had to be pushed down hard to give 700 its text contrast
const SHADES_FROM_700: ReadonlyArray<readonly [ScaleStep, number]> = [[800, 0.8], [900, 0.64], [950, 0.27]];

/** Re-derives 800…950 from the (corrected) 700, keeping the ladder's chroma for each step. */
export function shadesFrom700(scale: Scale, target: Record<ScaleStep, Oklch>, floorL: number): void {
  const lch700 = rgbToOklch(scale[700]);
  for (const [step, share] of SHADES_FROM_700) {
    scale[step] = oklchToRgb({ l: floorL + (lch700.l - floorL) * share, c: target[step].c, h: lch700.h });
  }
}

/** Target OKLCH for every step, hue fixed, before any contrast correction. */
export function ladder(anchor: Oklch, anchorStep: ScaleStep): Record<ScaleStep, Oklch> {
  const a = SCALE_STEPS.indexOf(anchorStep);
  const top = Math.max(TOP_L, anchor.l);
  const out = {} as Record<ScaleStep, Oklch>;
  SCALE_STEPS.forEach((step, i) => {
    const d = a - i;
    if (d > 0) {
      const k = Math.min(d, LIGHT_FRACTIONS.length) - 1;
      out[step] = { l: anchor.l + (top - anchor.l) * LIGHT_FRACTIONS[k], c: anchor.c * LIGHT_CHROMA[k], h: anchor.h };
    } else if (d < 0) {
      const k = Math.min(-d, DARK_CHROMA.length) - 1;
      out[step] = { l: shadeLightness(anchor.l, -d), c: anchor.c * DARK_CHROMA[k], h: anchor.h };
    } else {
      out[step] = anchor;
    }
  });
  return out;
}

/**
 * Moves lightness one small step at a time (hue fixed, chroma re-clamped to
 * sRGB) until `done` holds, returning the first colour that satisfies it or
 * the end of the range. Small steps keep the result as close to the starting
 * colour as the guarantee allows.
 */
export function walkLightness(start: Oklch, dir: 1 | -1, done: (rgb: Rgb) => boolean): Rgb {
  let rgb = oklchToRgb(start);
  for (let l = start.l; !done(rgb); ) {
    l += dir * WALK;
    if (l <= 0 || l >= 1) return oklchToRgb({ ...start, l: l <= 0 ? 0 : 1 });
    rgb = oklchToRgb({ ...start, l });
  }
  return rgb;
}

/** Walks `start` until it reaches `ratio` against every background. */
export function pushToContrast(start: Oklch, dir: 1 | -1, backgrounds: readonly Rgb[], ratio: number): Rgb {
  return walkLightness(start, dir, (c) => backgrounds.every((bg) => contrastRatio(c, bg) >= ratio));
}

/** Keeps `exact` when it already passes; otherwise walks from it. Preserves the chosen hex byte for byte. */
export function keepOrPush(exact: Rgb, dir: 1 | -1, backgrounds: readonly Rgb[], ratio: number): Rgb {
  if (backgrounds.every((bg) => contrastRatio(exact, bg) >= ratio)) return exact;
  return pushToContrast(rgbToOklch(exact), dir, backgrounds, ratio);
}

/** Corrections can break the ordering; each step below `from` must stay no lighter than the one above. */
export function enforceDarkerDown(scale: Scale, from: ScaleStep = 50): void {
  for (let i = Math.max(1, SCALE_STEPS.indexOf(from)); i < SCALE_STEPS.length; i++) {
    const above = relativeLuminance(scale[SCALE_STEPS[i - 1]]);
    const step = SCALE_STEPS[i];
    if (relativeLuminance(scale[step]) <= above) continue;
    scale[step] = walkLightness(rgbToOklch(scale[step]), -1, (c) => relativeLuminance(c) <= above);
  }
}

/** Mirror of enforceDarkerDown for the tints above `from`, after it was lightened. */
export function enforceLighterUp(scale: Scale, from: ScaleStep): void {
  for (let i = SCALE_STEPS.indexOf(from) - 1; i >= 0; i--) {
    const below = relativeLuminance(scale[SCALE_STEPS[i + 1]]);
    const step = SCALE_STEPS[i];
    if (relativeLuminance(scale[step]) >= below) continue;
    scale[step] = walkLightness(rgbToOklch(scale[step]), 1, (c) => relativeLuminance(c) >= below);
  }
}

/** CSS custom properties `--{prefix}-50` … `--{prefix}-950` as RGB channel strings. */
export function scaleVariables(prefix: string, scale: Scale): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const step of SCALE_STEPS) vars[`--${prefix}-${step}`] = toChannels(scale[step]);
  return vars;
}
