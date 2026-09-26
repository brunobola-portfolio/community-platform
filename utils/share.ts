/**
 * Share links built without any third-party script: WhatsApp and Facebook both
 * accept a plain URL, so sharing costs no SDK, no tracking pixel and no CSP
 * exception. What a recipient sees in the preview card comes from the page's
 * Open Graph tags, served per event and per article by convex/http.ts.
 */

/** Paths the public site exposes for a single piece of content. */
export const eventPath = (slug: string) => `/events/${encodeURIComponent(slug)}`;
export const postPath = (slug: string) => `/blog/${encodeURIComponent(slug)}`;

/** Absolute URL on the current origin, so a share never carries localhost. */
export function absoluteUrl(path: string, origin: string = window.location.origin): string {
    return new URL(path, origin).toString();
}

/**
 * WhatsApp only takes text; the URL must be inside it for the preview card to
 * appear. It goes on its own line at the end, where the app looks for it.
 */
export function whatsappShareUrl(text: string, url: string): string {
    const message = text ? `${text}\n${url}` : url;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Facebook ignores any text parameter; the card is built from the page itself. */
export function facebookShareUrl(url: string): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/** Date line for an event, in the form people write it on a poster. */
export function formatEventDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const day = date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
    const time = hasTime ? ` às ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}` : '';
    return `${day.charAt(0).toUpperCase()}${day.slice(1)}${time}`;
}

/** The message that travels with an event link: what, when, where. */
export function eventShareText(event: { title: string; date: string; location?: string }): string {
    const when = formatEventDate(event.date);
    const where = event.location ? ` · ${event.location}` : '';
    return [`*${event.title}*`, when ? `${when}${where}` : event.location ?? ''].filter(Boolean).join('\n');
}
