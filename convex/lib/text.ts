/**
 * Text helpers shared by Convex queries. Pure functions, no database access, so
 * the rules they encode can be exercised directly.
 */

/** Longest plain-text stand-in a public list carries instead of a rich-text body. */
export const EXCERPT_LENGTH = 300;

/**
 * Plain-text excerpt of a rich-text body. Tags become spaces rather than being
 * deleted, so "<p>one</p><p>two</p>" does not read as "onetwo"; entities are left
 * encoded because the client renders the result through the same sanitiser it
 * uses for the full body.
 */
export function toExcerpt(html: string): string {
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}\u2026` : text;
}
