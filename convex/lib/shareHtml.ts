/**
 * The page a link-preview crawler reads when an event or an article is shared.
 *
 * The portal is a single-page app: WhatsApp, Facebook, LinkedIn and Telegram
 * fetch the HTML without running JavaScript, so every shared link used to show
 * the generic site card. This page carries the content's own title, excerpt and
 * poster, and sends a person who lands on it straight to the real page.
 */

export interface ShareCard {
    siteName: string;
    title: string;
    description: string;
    /** Absolute image URL, or undefined to fall back to the site's own card. */
    image?: string;
    /** The public URL of the content; the preview is attributed to it. */
    canonicalUrl: string;
    type: 'article' | 'event';
}

/** Longest description a preview card shows before truncating on its own. */
export const SHARE_DESCRIPTION_LENGTH = 200;

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function shortDescription(text: string): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > SHARE_DESCRIPTION_LENGTH
        ? `${flat.slice(0, SHARE_DESCRIPTION_LENGTH).trimEnd()}…`
        : flat;
}

/**
 * A JSON string literal that cannot close the surrounding script element.
 * The redirect is script, not a meta refresh, on purpose: crawlers do not run
 * scripts, so none of them follows it back to a URL that is routed here again.
 */
export function scriptString(value: string): string {
    return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

export function renderSharePage(card: ShareCard): string {
    const title = escapeHtml(card.title);
    const description = escapeHtml(shortDescription(card.description));
    const url = escapeHtml(card.canonicalUrl);
    const site = escapeHtml(card.siteName);
    const origin = new URL(card.canonicalUrl).origin;
    const image = escapeHtml(card.image ?? `${origin}/og-image.png`);
    // Only the site's own card has known dimensions; a poster can be any shape
    const imageSize = card.image
        ? ''
        : '\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">';

    return `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <title>${title} · ${site}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${url}">
  <meta property="og:site_name" content="${site}">
  <meta property="og:type" content="${card.type === 'article' ? 'article' : 'website'}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="pt_PT">
  <meta property="og:image" content="${image}">${imageSize}
  <meta property="og:image:alt" content="${title}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="robots" content="noindex">
</head>
<body>
  <p><a href="${url}">${title}</a></p>
  <script>location.replace(${scriptString(card.canonicalUrl)});</script>
</body>
</html>
`;
}
