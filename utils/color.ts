/**
 * sRGB colour primitives shared by the brand generators: hex parsing, WCAG
 * luminance/contrast and alpha compositing. Kept free of any brand knowledge
 * so the palette, neutral and accent modules can all build on it.
 */

export type Rgb = readonly [number, number, number];

export const WHITE: Rgb = [255, 255, 255];
export const BLACK: Rgb = [0, 0, 0];

/** Returns `#rrggbb` in lower case, or null when the input is not a 3/6-digit hex colour. */
export function normalizeHex(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split('').map((c) => c + c).join('').toLowerCase()}`;
  }
  return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : null;
}

/** Parses a hex colour; invalid input yields `fallback` (black unless given). */
export function hexToRgb(hex: string, fallback: Rgb = BLACK): Rgb {
  const n = normalizeHex(hex);
  if (!n) return fallback;
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

export function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function linearToChannel(v: number): number {
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance(rgb: Rgb): number {
  return 0.2126 * channelToLinear(rgb[0]) + 0.7152 * channelToLinear(rgb[1]) + 0.0722 * channelToLinear(rgb[2]);
}

/** WCAG 2.x contrast ratio between two colours (1…21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * `top` painted with `alpha` over `bottom`, the way the browser composites
 * `bg-brand-500/15`. This is the one place sRGB mixing is correct: it models
 * what the page renders, not a perceptual tint.
 */
export function alphaBlend(bottom: Rgb, top: Rgb, alpha: number): Rgb {
  const ch = (i: 0 | 1 | 2) => Math.round(bottom[i] + (top[i] - bottom[i]) * alpha);
  return [ch(0), ch(1), ch(2)];
}

/** `R G B` channel string, the format Tailwind's `<alpha-value>` placeholder needs. */
export function toChannels(rgb: Rgb): string {
  return rgb.map((c) => Math.round(c)).join(' ');
}
