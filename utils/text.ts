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
