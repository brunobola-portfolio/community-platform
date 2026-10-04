/**
 * sRGB ↔ OKLab ↔ OKLCH conversions (Björn Ottosson's matrices).
 *
 * The brand scale is built here instead of by mixing with white/black in sRGB:
 * sRGB mixing drifts the perceived hue (a red tinted with white turns pink, a
 * blue shaded with black turns purple), while OKLCH keeps the hue fixed and
 * lets lightness and chroma move independently.
 */

import { channelToLinear, linearToChannel } from './color';
import type { Rgb } from './color';

export interface Oklch {
  /** Perceptual lightness, 0…1. */
  l: number;
  /** Chroma, 0…~0.37 within sRGB. */
  c: number;
  /** Hue angle in degrees, 0…360 (0 for achromatic colours). */
  h: number;
}

type Vec3 = [number, number, number];

// Below this chroma the hue angle is numerical noise; treating it as 0 keeps
// greys from picking up a random tint when chroma is later scaled up
const ACHROMATIC = 1e-4;
// Linear-light tolerance for "inside sRGB": the matrices round-trip with ~1e-7 error
const GAMUT_EPS = 1e-6;

function linearToOklab([r, g, b]: Vec3): Vec3 {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear([L, a, b]: Vec3): Vec3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function oklchToLinear({ l, c, h }: Oklch): Vec3 {
  const rad = (h * Math.PI) / 180;
  return oklabToLinear([l, c * Math.cos(rad), c * Math.sin(rad)]);
}

export function rgbToOklch(rgb: Rgb): Oklch {
  const [L, a, b] = linearToOklab([channelToLinear(rgb[0]), channelToLinear(rgb[1]), channelToLinear(rgb[2])]);
  const c = Math.hypot(a, b);
  if (c < ACHROMATIC) return { l: L, c: 0, h: 0 };
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { l: L, c, h: h < 0 ? h + 360 : h };
}

export function isInGamut(lch: Oklch): boolean {
  return oklchToLinear(lch).every((v) => v >= -GAMUT_EPS && v <= 1 + GAMUT_EPS);
}

/**
 * Brings a colour inside sRGB by lowering chroma only (binary search), never
 * touching lightness or hue: a too-vivid light tint becomes a softer tint of
 * the same hue instead of shifting towards another colour.
 */
export function clampChroma(lch: Oklch): Oklch {
  const l = Math.min(1, Math.max(0, lch.l));
  const base = { l, c: Math.max(0, lch.c), h: lch.h };
  if (isInGamut(base)) return base;
  let lo = 0;
  let hi = base.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (isInGamut({ l, c: mid, h: lch.h })) lo = mid;
    else hi = mid;
  }
  return { l, c: lo, h: lch.h };
}

/** OKLCH → 8-bit sRGB, gamut-clamped by chroma reduction. */
export function oklchToRgb(lch: Oklch): Rgb {
  const [r, g, b] = oklchToLinear(clampChroma(lch));
  return [linearToChannel(r), linearToChannel(g), linearToChannel(b)];
}

/** Smallest angular distance between two hues, 0…180 degrees. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
