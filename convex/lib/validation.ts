import { MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";

type SlugTable = "events" | "posts" | "categories";

/**
 * Assert that a slug is unique within a table.
 * Pass excludeId when updating to exclude the current document.
 */
export async function assertUniqueSlug(
  ctx: MutationCtx,
  table: SlugTable,
  slug: string,
  excludeId?: string
) {
  const existing = await ctx.db
    .query(table)
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();
  if (existing && String(existing._id) !== excludeId) {
    throw new ConvexError(`Já existe um registo com o slug "${slug}".`);
  }
}

/**
 * Assert that a category reference resolves to an existing category.
 * Accepts a category document id, slug or name — the admin UI stores the
 * document id while seeds/legacy data may reference slug or name.
 */
export async function assertCategoryExists(ctx: MutationCtx, categoryId: string) {
  const byId = ctx.db.normalizeId("categories", categoryId);
  if (byId && (await ctx.db.get(byId))) return;
  const bySlug = await ctx.db
    .query("categories")
    .withIndex("by_slug", (q) => q.eq("slug", categoryId))
    .first();
  if (bySlug) return;
  const byName = await ctx.db
    .query("categories")
    .withIndex("by_name", (q) => q.eq("name", categoryId))
    .first();
  if (byName) return;
  throw new ConvexError("Categoria não encontrada.");
}

/**
 * Basic email format validation.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Validate maximum length of a string field.
 */
export function validateMaxLength(value: string, field: string, max: number) {
  if (value.length > max) {
    throw new ConvexError(`O campo "${field}" excede o limite de ${max} caracteres.`);
  }
}

/**
 * Validate required string fields are not empty.
 */
export function validateRequired(fields: Record<string, unknown>, requiredKeys: string[]) {
  for (const key of requiredKeys) {
    const val = fields[key];
    if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
      throw new ConvexError(`O campo "${key}" é obrigatório.`);
    }
  }
}

/**
 * Server-side HTML sanitization (defense-in-depth, whitelist approach).
 * Only allows known-safe tags and attributes. Strips everything else.
 * The frontend also sanitizes with DOMPurify; this is a secondary safeguard.
 */
export function sanitizeContentServer(html: string): string {
  // Allowed tags (content preserved, tag kept)
  const ALLOWED_TAGS = new Set([
    "p", "br", "b", "i", "u", "em", "strong", "a", "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
    "span", "div", "img", "figure", "figcaption", "table", "thead",
    "tbody", "tr", "th", "td", "hr", "sub", "sup", "mark", "small",
  ]);
  // Allowed attributes per tag (all others stripped)
  const ALLOWED_ATTRS: Record<string, Set<string>> = {
    a: new Set(["href", "title", "target", "rel"]),
    img: new Set(["src", "alt", "width", "height", "loading"]),
    td: new Set(["colspan", "rowspan"]),
    th: new Set(["colspan", "rowspan"]),
    "*": new Set(["class", "id"]),
  };
  // Dangerous URI schemes
  const DANGEROUS_URI = /^\s*(javascript|vbscript|data)\s*:/i;

  let result = "";
  let i = 0;

  while (i < html.length) {
    if (html[i] === "<") {
      // Find end of tag
      const tagEnd = html.indexOf(">", i);
      if (tagEnd === -1) { result += "&lt;"; i++; continue; }

      const fullTag = html.substring(i, tagEnd + 1);
      // Check if closing tag
      const closingMatch = fullTag.match(/^<\/\s*([a-zA-Z][a-zA-Z0-9]*)\s*>$/);
      if (closingMatch) {
        const tagName = closingMatch[1].toLowerCase();
        if (ALLOWED_TAGS.has(tagName)) { result += `</${tagName}>`; }
        i = tagEnd + 1; continue;
      }
      // Opening/self-closing tag
      const openMatch = fullTag.match(/^<\s*([a-zA-Z][a-zA-Z0-9]*)/);
      if (!openMatch) { result += "&lt;"; i++; continue; }

      const tagName = openMatch[1].toLowerCase();
      if (!ALLOWED_TAGS.has(tagName)) {
        // Strip tag but keep content (skip to after >)
        i = tagEnd + 1; continue;
      }

      // Parse and filter attributes
      const isSelfClosing = fullTag.endsWith("/>");
      const attrString = fullTag.substring(openMatch[0].length, fullTag.length - (isSelfClosing ? 2 : 1));
      const attrRegex = /\s+([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;
      const allowedForTag = ALLOWED_ATTRS[tagName] || new Set<string>();
      const globalAllowed = ALLOWED_ATTRS["*"] || new Set<string>();
      let cleanAttrs = "";
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";
        // Block on* event handlers
        if (attrName.startsWith("on")) continue;
        // Block dangerous URIs in href/src
        if ((attrName === "href" || attrName === "src") && DANGEROUS_URI.test(attrValue)) continue;
        // Only allow whitelisted attributes
        if (allowedForTag.has(attrName) || globalAllowed.has(attrName)) {
          cleanAttrs += ` ${attrName}="${attrValue.replace(/"/g, "&quot;")}"`;
        }
      }
      // Force rel="noopener noreferrer" on links with target
      if (tagName === "a" && cleanAttrs.includes("target=")) {
        cleanAttrs += ' rel="noopener noreferrer"';
      }
      result += `<${tagName}${cleanAttrs}${isSelfClosing ? " /" : ""}>`;
      i = tagEnd + 1;
    } else {
      result += html[i];
      i++;
    }
  }
  return result;
}
