/**
 * DOM side of the dynamic brand: writes the palette and font variables on an
 * element, keeps one Google Fonts stylesheet per purpose and remembers the
 * last brand so a returning visitor does not see the platform default first.
 */

import { DEFAULT_BRAND_COLOR, brandCssVariables, deriveBrandPalette, normalizeHex, rgbToHex } from './brandPalette';
import {
  BODY_FONTS,
  DEFAULT_BODY_FONT,
  DEFAULT_HEADING_FONT,
  HEADING_FONTS,
  fontStack,
  googleFontsHref,
  resolveFont,
} from './brandFonts';
import type { BrandFont } from './brandFonts';

export interface BrandChoice {
  color: string;
  heading: BrandFont;
  body: BrandFont;
}

const CACHE_KEY = 'portal-brand';
/** Id of the stylesheet that loads the non-default brand fonts of the instance. */
const BRAND_FONT_LINK_ID = 'brand-fonts';

/** Normalises raw settings values into a brand that is safe to apply. */
export function resolveBrand(color?: string, heading?: string, body?: string): BrandChoice {
  return {
    color: normalizeHex(color) ?? DEFAULT_BRAND_COLOR,
    heading: resolveFont(HEADING_FONTS, heading, DEFAULT_HEADING_FONT),
    body: resolveFont(BODY_FONTS, body, DEFAULT_BODY_FONT),
  };
}

/** Sets `--brand-*`, `--font-heading` and `--font-body` on `el`. */
export function applyBrandVariables(el: HTMLElement, brand: BrandChoice): void {
  for (const [name, value] of Object.entries(brandCssVariables(brand.color))) {
    el.style.setProperty(name, value);
  }
  el.style.setProperty('--font-heading', fontStack(brand.heading));
  el.style.setProperty('--font-body', fontStack(brand.body));
}

/** Fonts not already loaded by the static link in index.html. */
export function extraFonts(brand: BrandChoice): BrandFont[] {
  return [brand.body, brand.heading].filter((f) => f !== DEFAULT_BODY_FONT && f !== DEFAULT_HEADING_FONT);
}

/**
 * Creates, updates or removes the `<link rel="stylesheet">` with this id.
 * One link per purpose means switching fonts replaces the request instead of
 * piling up stylesheets for every choice tried in the backoffice.
 */
export function syncFontStylesheet(id: string, fonts: readonly BrandFont[]): void {
  const existing = document.getElementById(id);
  if (fonts.length === 0) {
    existing?.remove();
    return;
  }
  const href = googleFontsHref(fonts);
  if (existing instanceof HTMLLinkElement) {
    if (existing.href !== href) existing.href = href;
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/** Browser chrome colour on mobile: brand-700, which white system text reads on. */
export function syncThemeColor(color: string): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = rgbToHex(deriveBrandPalette(color)[700]);
}

export function cacheBrand(brand: BrandChoice): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ color: brand.color, heading: brand.heading.family, body: brand.body.family }));
  } catch {
    // Private mode or blocked storage: the index.css defaults still cover first paint
  }
}

function readCachedBrand(): BrandChoice | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { color, heading, body } = parsed as Record<string, unknown>;
    return resolveBrand(
      typeof color === 'string' ? color : undefined,
      typeof heading === 'string' ? heading : undefined,
      typeof body === 'string' ? body : undefined,
    );
  } catch {
    return null;
  }
}

/** Applies a brand to the whole document: variables, fonts and theme colour. */
export function applyDocumentBrand(brand: BrandChoice): void {
  applyBrandVariables(document.documentElement, brand);
  syncFontStylesheet(BRAND_FONT_LINK_ID, extraFonts(brand));
  syncThemeColor(brand.color);
}

/**
 * Runs before React mounts: settings arrive only after the Convex round trip,
 * and without this a returning visitor would see the platform colour first.
 */
export function applyCachedBrand(): void {
  const cached = readCachedBrand();
  if (cached) applyDocumentBrand(cached);
}
