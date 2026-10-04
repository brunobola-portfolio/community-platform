/**
 * The guides mark exact button and field names with **double asterisks**, so the
 * copy stays plain data while the reader can show them in bold. Search, word
 * counts and print all go through these helpers so the markers never leak.
 */

export interface TextSegment {
    text: string;
    bold: boolean;
}

const BOLD = /\*\*(.+?)\*\*/g;

export function boldSegments(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let last = 0;
    for (const match of text.matchAll(BOLD)) {
        const start = match.index ?? 0;
        if (start > last) segments.push({ text: text.slice(last, start), bold: false });
        segments.push({ text: match[1], bold: true });
        last = start + match[0].length;
    }
    if (last < text.length) segments.push({ text: text.slice(last), bold: false });
    return segments;
}

export function plainText(text: string): string {
    return text.replace(BOLD, '$1');
}

/** Words as a reader counts them; the content test keeps each step at 20 or fewer. */
export function wordCount(text: string): number {
    return plainText(text).split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Deep link to a guide; the same `?ajuda=` parameter works on /ajuda and on /admin. */
export function helpLink(origin: string, path: string, param: string, id: string): string {
    return `${origin}${path}?${param}=${encodeURIComponent(id)}`;
}
