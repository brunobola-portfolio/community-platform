/** Lowercase, accent-free form used for search matching and slugs. */
export function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Plain-text stand-in for an event body. The public list carries an excerpt
 * instead of the rich-text description, so cards, search, calendar exports and
 * structured data read from whichever of the two the subscription provided.
 */
export function eventSummaryText(event: { excerpt?: string; description?: string }): string {
  return event.excerpt || event.description || '';
}

/** URL-safe slug from a title; never empty so schema fields stay valid. */
export function slugify(text: string): string {
  const slug = normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug || `registo-${Date.now()}`;
}

/**
 * Quantised width classes for progress bars; Tailwind only compiles classes it
 * can see, so the fill is expressed as one of eleven static widths.
 */
const WIDTH_CLASSES = ['w-0', 'w-[10%]', 'w-[20%]', 'w-[30%]', 'w-[40%]', 'w-[50%]', 'w-[60%]', 'w-[70%]', 'w-[80%]', 'w-[90%]', 'w-full'];
export function progressWidthClass(percent: number): string {
  const clamped = Math.min(100, Math.max(0, percent));
  const step = clamped > 0 ? Math.max(1, Math.round(clamped / 10)) : 0;
  return WIDTH_CLASSES[Math.min(10, step)];
}

const escapeText = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Plain text as the paragraphs it was written in: a blank line starts a new
 * paragraph, a single newline stays a line break. Used for pasted text, which
 * would otherwise run together into one block on the site.
 */
export function plainTextToHtml(text: string): string {
    return text
        .replace(/\r\n?/g, '\n')
        .split(/\n{2,}/)
        .map(block => block.trim())
        .filter(Boolean)
        .map(block => `<p>${escapeText(block).replace(/\n/g, '<br>')}</p>`)
        .join('');
}

/**
 * Whether an article's lead would only repeat its own opening. The excerpt is
 * generated from the body when nobody writes one, so on a short article the
 * highlighted lead and the first paragraph say the same thing twice.
 */
export function isLeadRedundant(excerpt: string, bodyHtml: string): boolean {
    const flatten = (value: string) => value
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        // An inline tag closing before punctuation leaves a space the author never typed
        .replace(/ ([.,;:!?…])/g, '$1')
        .trim()
        .toLowerCase();
    const lead = flatten(excerpt).replace(/(…|\.\.\.)$/, '').trim();
    return lead.length > 0 && flatten(bodyHtml).startsWith(lead);
}
