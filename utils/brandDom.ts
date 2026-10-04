/**
 * DOM side of the dynamic brand: writes the brand variables on an element,
 * keeps one Google Fonts stylesheet per purpose and remembers the last brand
 * so a returning visitor does not see the platform default first.
 */

import { deriveBrandPalette, rgbToHex } from './brandPalette';
import { googleFontsHref } from './brandFonts';
import type { BrandFont } from './brandFonts';
import { brandThemeVariables, extraFonts, parseCachedBrand, serializeBrand } from './brandTheme';
import type { BrandChoice } from './brandTheme';

export { extraFonts, resolveBrand } from './brandTheme';
export type { BrandChoice, BrandInput } from './brandTheme';

const CACHE_KEY = 'portal-brand';
/** Id of the stylesheet that loads the non-default brand fonts of the instance. */
const BRAND_FONT_LINK_ID = 'brand-fonts';

/** Sets every brand custom property (scales, display, accent, fonts) on `el`. */
export function applyBrandVariables(el: HTMLElement, brand: BrandChoice): void {
  for (const [name, value] of Object.entries(brandThemeVariables(brand))) {
    el.style.setProperty(name, value);
  }
}

/**
 * Creates, updates or removes the `<link rel="stylesheet">` with this id.
 * One link per purpose means switching fonts replaces the request instead of
 * piling up stylesheets for every choice tried in the backoffice. If Google
 * Fonts is unreachable the link simply fails and the fallback stack of each
 * family (fontStack) renders instead.
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
    localStorage.setItem(CACHE_KEY, serializeBrand(brand));
  } catch {
    // Private mode or blocked storage: the index.css defaults still cover first paint
  }
}

function readCachedBrand(): BrandChoice | null {
  try {
    return parseCachedBrand(localStorage.getItem(CACHE_KEY));
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
