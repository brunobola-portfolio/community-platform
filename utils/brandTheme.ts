/**
 * The whole per-instance brand as one value: resolved colours and fonts, the
 * CSS variables they produce, and the cache format that lets a returning
 * visitor get their brand before settings arrive. Pure, so it is unit-tested;
 * utils/brandDom.ts does the DOM writes.
 */

import { DEFAULT_BRAND_COLOR, brandBase, brandCssVariables } from './brandPalette';
import { accentCssVariables, resolveAccentColor } from './brandAccent';
import { deriveNeutralScale, neutralCssVariables } from './brandNeutrals';
import {
  BODY_FONTS,
  DEFAULT_BODY_FONT,
  DEFAULT_FONTS,
  DEFAULT_HEADING_FONT,
  DEFAULT_MONO_FONT,
  HEADING_FONTS,
  MONO_FONTS,
  fontStack,
  resolveFont,
} from './brandFonts';
import type { BrandFont } from './brandFonts';
import { normalizeHex } from './color';

/** Raw values as they come from settings (any may be missing or invalid). */
export interface BrandInput {
  color?: string | null;
  accent?: string | null;
  heading?: string | null;
  body?: string | null;
  mono?: string | null;
}

export interface BrandChoice {
  color: string;
  /** Resolved accent: the stored one, or the automatic choice for this brand. */
  accent: string;
  heading: BrandFont;
  body: BrandFont;
  mono: BrandFont;
}

/** Normalises raw settings values into a brand that is safe to apply. */
export function resolveBrand(input: BrandInput): BrandChoice {
  const color = normalizeHex(input.color) ?? DEFAULT_BRAND_COLOR;
  return {
    color,
    accent: resolveAccentColor(color, input.accent),
    heading: resolveFont(HEADING_FONTS, input.heading, DEFAULT_HEADING_FONT),
    body: resolveFont(BODY_FONTS, input.body, DEFAULT_BODY_FONT),
    mono: resolveFont(MONO_FONTS, input.mono, DEFAULT_MONO_FONT),
  };
}

/** Every custom property the brand drives: brand, display, neutral and accent scales plus the three fonts. */
export function brandThemeVariables(brand: BrandChoice): Record<string, string> {
  return {
    ...brandCssVariables(brand.color),
    ...neutralCssVariables(deriveNeutralScale(brandBase(brand.color))),
    ...accentCssVariables(brand.accent, brand.color),
    '--font-heading': fontStack(brand.heading),
    '--font-body': fontStack(brand.body),
    '--font-mono': fontStack(brand.mono),
  };
}

/** Fonts not already loaded by the static link in index.html. */
export function extraFonts(brand: BrandChoice): BrandFont[] {
  return [brand.body, brand.mono, brand.heading].filter((f) => !DEFAULT_FONTS.includes(f));
}

export function serializeBrand(brand: BrandChoice): string {
  return JSON.stringify({
    color: brand.color,
    accent: brand.accent,
    heading: brand.heading.family,
    body: brand.body.family,
    mono: brand.mono.family,
  });
}

/**
 * Reads what serializeBrand wrote. Tolerates anything: a cache from an older
 * release (no accent or mono), hand-edited storage or plain garbage falls back
 * field by field, and unreadable JSON yields null so the CSS defaults stand.
 */
export function parseCachedBrand(raw: string | null): BrandChoice | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    const pick = (key: string) => (typeof record[key] === 'string' ? (record[key] as string) : undefined);
    return resolveBrand({ color: pick('color'), accent: pick('accent'), heading: pick('heading'), body: pick('body'), mono: pick('mono') });
  } catch {
    return null;
  }
}
