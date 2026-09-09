import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import type { Event } from '../types';

/**
 * The public event subscription carries a plain-text excerpt instead of the
 * rich-text body, so the modal fetches the description of the open event only.
 * Admin sessions subscribe to the full list and request nothing extra; while
 * the body is in flight the excerpt stands in, so the modal never opens empty.
 */
export function useEventDescription(event: Event | null): { html: string; isLoading: boolean } {
  const pendingId = event && !event.description ? (event.id as Id<'events'>) : null;
  const full = useQuery(api.events.getById, pendingId ? { id: pendingId } : 'skip');

  if (!event) return { html: '', isLoading: false };
  if (event.description) return { html: event.description, isLoading: false };
  return {
    html: full?.description ?? event.excerpt ?? '',
    isLoading: full === undefined,
  };
}
