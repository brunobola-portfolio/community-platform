/**
 * Brand palette derivation.
 *
 * Each instance picks ONE colour in the backoffice; the whole `brand-50…950`
 * scale is derived from it at runtime and exposed as CSS variables holding
 * space-separated RGB channels, so Tailwind's `rgb(var(--brand-500) / <alpha>)`
 * keeps opacity modifiers working.
 *
 * The site was audited against WCAG AA with fixed shades doing fixed jobs
 * (white text on brand-700, brand-700 text on light, brand-400 text on dark).
 * An arbitrary colour cannot be trusted to keep those promises, so after the
 * tint/shade mix every load-bearing step is nudged until it does.
 */

export const DEFAULT_BRAND_COLOR = '#4f46e5';

export const BRAND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type BrandStep = (typeof BRAND_STEPS)[number];

export type Rgb = readonly [number, number, number];
export type BrandPalette = Record<BrandStep, Rgb>;

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];
// Surfaces the brand is read against: white/slate-50 in light, dark-surface in dark
const LIGHT_BG: Rgb = [255, 255, 255];
const DARK_SURFACE: Rgb = [15, 23, 42];

// Share of the base colour kept in each tint (the rest is white)
const TINTS: Partial<Record<BrandStep, number>> = { 50: 0.06, 100: 0.12, 200: 0.24, 300: 0.4, 400: 0.62, 500: 0.82 };
// Share of black mixed into brand-700, and into the (corrected) brand-700 for
// the deeper shades: deriving them from the corrected step keeps hover states
// visibly darker even after a light colour had to be pushed down hard
const SHADE_700 = 0.16;
const SHADES_FROM_700: Partial<Record<BrandStep, number>> = { 800: 0.19, 900: 0.345, 950: 0.585 };

// Small headroom above the WCAG thresholds absorbs rounding and the slight
// tint that `bg-brand-500/10` badges put behind brand text
const AA_TEXT = 4.6;
const AA_LARGE = 3.05;

/** Returns `#rrggbb` in lower case, or null when the input is not a 3/6-digit hex colour. */
export function normalizeHex(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split('').map((c) => c + c).join('').toLowerCase()}`;
  }
  return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : null;
}

export function hexToRgb(hex: string): Rgb {
  const n = normalizeHex(hex) ?? DEFAULT_BRAND_COLOR;
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance(rgb: Rgb): number {
  const r = channelToLinear(rgb[0]);
  const g = channelToLinear(rgb[1]);
  const b = channelToLinear(rgb[2]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two colours (1…21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Mixes `amount` (0…1) of `to` into `from`, rounding to whole channels. */
function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  const ch = (i: 0 | 1 | 2) => Math.round(from[i] + (to[i] - from[i]) * amount);
  return [ch(0), ch(1), ch(2)];
}

/**
 * Walks `colour` towards `target` (black to darken, white to lighten) until it
 * reaches `ratio` against every background. Small steps keep the hue as close
 * to the chosen colour as the guarantee allows.
 */
function pushUntil(colour: Rgb, target: Rgb, backgrounds: Rgb[], ratio: number): Rgb {
  return walkUntil(colour, target, (c) => backgrounds.every((bg) => contrastRatio(c, bg) >= ratio));
}

/** Walks `colour` towards `target` until `done` holds (or the target is reached). */
function walkUntil(colour: Rgb, target: Rgb, done: (c: Rgb) => boolean): Rgb {
  let current = colour;
  for (let k = 1; k <= 100 && !done(current); k++) current = mix(colour, target, k / 100);
  return current;
}

/** Corrections can break the ordering; each step must stay no lighter than the one above. */
function enforceDarkerDown(palette: Record<BrandStep, Rgb>): void {
  for (let i = 1; i < BRAND_STEPS.length; i++) {
    const above = relativeLuminance(palette[BRAND_STEPS[i - 1]]);
    const step = BRAND_STEPS[i];
    palette[step] = walkUntil(palette[step], BLACK, (c) => relativeLuminance(c) <= above);
  }
}

/** Mirror of enforceDarkerDown for the tints after brand-400 was lightened. */
function enforceLighterUp(palette: Record<BrandStep, Rgb>, from: BrandStep): void {
  for (let i = BRAND_STEPS.indexOf(from) - 1; i >= 0; i--) {
    const below = relativeLuminance(palette[BRAND_STEPS[i + 1]]);
    const step = BRAND_STEPS[i];
    palette[step] = walkUntil(palette[step], WHITE, (c) => relativeLuminance(c) >= below);
  }
}

/** Derives the full brand scale from one hex colour (invalid input uses the platform default). */
export function deriveBrandPalette(input: string | null | undefined): BrandPalette {
  const base = hexToRgb(normalizeHex(input) ?? DEFAULT_BRAND_COLOR);
  const palette = {} as Record<BrandStep, Rgb>;
  for (const step of BRAND_STEPS) {
    const tint = TINTS[step];
    palette[step] = tint !== undefined ? mix(WHITE, base, tint) : base;
  }

  // Light theme: buttons and links. brand-700 carries body-size text both ways
  // (white on it, it on white or a faint brand tint); brand-600 large text only
  palette[600] = pushUntil(base, BLACK, [LIGHT_BG], AA_LARGE);
  palette[700] = pushUntil(mix(base, BLACK, SHADE_700), BLACK, [LIGHT_BG, palette[100]], AA_TEXT);
  for (const [step, amount] of Object.entries(SHADES_FROM_700)) {
    palette[Number(step) as BrandStep] = mix(palette[700], BLACK, amount);
  }
  enforceDarkerDown(palette);

  // Dark theme: brand-400 is the text colour on dark surfaces, and very dark
  // brand colours (navy, burgundy) would sink into the background
  const darkTint = mix(DARK_SURFACE, palette[500], 0.15);
  palette[400] = pushUntil(palette[400], WHITE, [DARK_SURFACE, darkTint], AA_TEXT);
  enforceLighterUp(palette, 400);
  return palette;
}

/** `R G B` channel string, the format Tailwind's `<alpha-value>` placeholder needs. */
export function toChannels(rgb: Rgb): string {
  return rgb.map((c) => Math.round(c)).join(' ');
}

/** CSS custom properties (`--brand-50` … `--brand-950`) for a brand colour. */
export function brandCssVariables(input: string | null | undefined): Record<string, string> {
  const palette = deriveBrandPalette(input);
  const vars: Record<string, string> = {};
  for (const step of BRAND_STEPS) vars[`--brand-${step}`] = toChannels(palette[step]);
  return vars;
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
  /** True when the derived brand-600 had to be darkened to keep AA. */
  adjusted: boolean;
}

/** Contrast figures for the backoffice indicator. */
export function brandContrastReport(input: string | null | undefined): BrandContrastReport {
  const base = hexToRgb(normalizeHex(input) ?? DEFAULT_BRAND_COLOR);
  const p = deriveBrandPalette(input);
  return {
    baseOnWhite: contrastRatio(base, WHITE),
    textOn700: contrastRatio(p[700], WHITE),
    largeOn600: contrastRatio(p[600], WHITE),
    darkText400: contrastRatio(p[400], DARK_SURFACE),
    adjusted: rgbToHex(p[600]) !== rgbToHex(base),
  };
}
