/**
 * Maps an AI studio draft onto the exact formData keys EventForm and PostForm
 * edit, so the secretary lands on the ordinary form already filled in and
 * saves through the ordinary path (buildPayload + the entity wrappers).
 */

import type { AdminFormData } from '../types';
import type { StudioResult } from '../../../convex/lib/aiStudioDraft';

/**
 * Marks a form that opened prefilled: its first snapshot already holds work the
 * secretary would lose, so closing it must ask first. Stripped before saving.
 */
export const AI_DRAFT_FLAG = '_aiDraft';

/** "3 min" at ~200 words per minute, never below one. */
export function readTimeFor(html: string): string {
    const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.round(words / 200))} min`;
}

export interface MapOptions {
    /** Current local time as "YYYY-MM-DDTHH:mm", the date of a news item. */
    nowLocal: string;
    /** The optimised image URL, which replaces the heavy original the action stored. */
    imageUrl?: string;
}

export function draftToFormData(result: StudioResult, options: MapOptions): { type: 'event' | 'post'; data: AdminFormData } | null {
    const imageUrl = options.imageUrl ?? result.imageUrl ?? '';
    if (result.kind === 'event' && result.event) {
        const e = result.event;
        return {
            type: 'event',
            data: {
                title: e.title,
                description: e.descriptionHtml,
                date: e.date,
                location: e.location,
                categoryId: e.categoryId,
                status: 'published',
                isHighlight: false,
                isTournament: e.isTournament,
                tournamentType: e.tournamentType,
                // The inputs show '' as "free" and "no limit"; 0 would read as a typed value
                entryPrice: e.entryPrice > 0 ? e.entryPrice : '',
                maxParticipants: e.maxParticipants ?? '',
                registrationOpen: e.registrationOpen,
                allowGuestRegistration: true,
                currentParticipants: 0,
                registrationFields: e.registrationFields.map(f => ({ ...f, placeholder: '' })),
                imageUrl,
                [AI_DRAFT_FLAG]: true,
            },
        };
    }
    if (result.kind === 'post' && result.post) {
        const p = result.post;
        return {
            type: 'post',
            data: {
                title: p.title,
                excerpt: p.excerpt,
                content: p.contentHtml,
                tags: p.tags,
                categoryId: p.categoryId,
                published: true,
                date: options.nowLocal,
                readTime: readTimeFor(p.contentHtml),
                coverUrl: imageUrl,
                [AI_DRAFT_FLAG]: true,
            },
        };
    }
    return null;
}
