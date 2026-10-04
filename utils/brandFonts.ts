/**
 * Curated Google Fonts for the per-instance brand.
 *
 * A free-text family would let a typo break every heading and would widen what
 * the CSP has to trust, so the backoffice only offers these. Each entry carries
 * the exact css2 `family=` query (weights the site actually uses, italics for
 * headings that the History quote and pull quotes render) and the generic
 * fallback shown while the file loads.
 */

export interface BrandFont {
  /** Family name as stored in settings and used in CSS. */
  family: string;
  /** Value of the css2 `family=` parameter. */
  query: string;
  /** Generic fallback stack appended after the family. */
  fallback: string;
}

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, "Cascadia Mono", Menlo, Consolas, monospace';

export const HEADING_FONTS: readonly BrandFont[] = [
  { family: 'Playfair Display', query: 'Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400', fallback: SERIF },
  { family: 'Fraunces', query: 'Fraunces:ital,wght@0,400;0,600;0,700;0,900;1,400', fallback: SERIF },
  { family: 'DM Serif Display', query: 'DM+Serif+Display:ital@0;1', fallback: SERIF },
  { family: 'Lora', query: 'Lora:ital,wght@0,400;0,600;0,700;1,400', fallback: SERIF },
  { family: 'Merriweather', query: 'Merriweather:ital,wght@0,400;0,700;0,900;1,400', fallback: SERIF },
  { family: 'Cormorant Garamond', query: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400', fallback: SERIF },
  { family: 'Libre Baskerville', query: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400', fallback: SERIF },
  { family: 'Bricolage Grotesque', query: 'Bricolage+Grotesque:wght@400;600;700;800', fallback: SANS },
];

export const BODY_FONTS: readonly BrandFont[] = [
  { family: 'Geist', query: 'Geist:wght@100..900', fallback: SANS },
  { family: 'Inter', query: 'Inter:wght@300..900', fallback: SANS },
  { family: 'Manrope', query: 'Manrope:wght@300..800', fallback: SANS },
  { family: 'Plus Jakarta Sans', query: 'Plus+Jakarta+Sans:wght@300..800', fallback: SANS },
  { family: 'Source Sans 3', query: 'Source+Sans+3:wght@300..900', fallback: SANS },
  { family: 'Nunito Sans', query: 'Nunito+Sans:wght@300..900', fallback: SANS },
  { family: 'Work Sans', query: 'Work+Sans:wght@300..900', fallback: SANS },
  { family: 'DM Sans', query: 'DM+Sans:wght@300..900', fallback: SANS },
];

// Eyebrows, dates and figures: a brand guide usually names its mono, and the
// system fallback (Consolas on Windows) looks nothing like any of them
export const MONO_FONTS: readonly BrandFont[] = [
  { family: 'Geist Mono', query: 'Geist+Mono:wght@100..900', fallback: MONO },
  { family: 'JetBrains Mono', query: 'JetBrains+Mono:wght@100..800', fallback: MONO },
  { family: 'IBM Plex Mono', query: 'IBM+Plex+Mono:wght@300;400;500;600;700', fallback: MONO },
  { family: 'DM Mono', query: 'DM+Mono:wght@300;400;500', fallback: MONO },
  { family: 'Space Mono', query: 'Space+Mono:wght@400;700', fallback: MONO },
];

export const DEFAULT_HEADING_FONT = HEADING_FONTS[0];
export const DEFAULT_BODY_FONT = BODY_FONTS[0];
export const DEFAULT_MONO_FONT = MONO_FONTS[0];
/** Families the static `<link>` in index.html already loads, in its order. */
export const DEFAULT_FONTS: readonly BrandFont[] = [DEFAULT_BODY_FONT, DEFAULT_MONO_FONT, DEFAULT_HEADING_FONT];

/** Resolves a stored family name against the curated list; unknown names fall back to the default. */
export function resolveFont(list: readonly BrandFont[], family: string | null | undefined, fallback: BrandFont): BrandFont {
  const wanted = (family ?? '').trim().toLowerCase();
  return list.find((f) => f.family.toLowerCase() === wanted) ?? fallback;
}

/** CSS `font-family` value: quoted family plus its generic fallback stack. */
export function fontStack(font: BrandFont): string {
  return `"${font.family}", ${font.fallback}`;
}

/** One css2 stylesheet URL for several families, deduplicated. */
export function googleFontsHref(fonts: readonly BrandFont[]): string {
  const queries = Array.from(new Set(fonts.map((f) => f.query)));
  return `https://fonts.googleapis.com/css2?${queries.map((q) => `family=${q}`).join('&')}&display=swap`;
}
