import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { EventCreateArgs } from './types';
import { toActionResult } from './helpers';
import { slugify } from '../../utils/text';
import type { ActionDeps } from './deps';

/** Event wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useEventActions({ logActivity, describeAction }: ActionDeps) {
  const createEventMut = useMutation(api.events.create);
  const clearStorageMut = useMutation(api.events.clearStorageImage);
  const updateEventMut = useMutation(api.events.update);
  const deleteEventMut = useMutation(api.events.remove);

  const addEvent = useCallback(
    async (data: EventCreateArgs): Promise<ActionResult> => {
      try {
        // category is joined client-side for display; the validator rejects it
        const { imageUrl, category: _category, ...rest } = data as EventCreateArgs & { category?: string };
        // Fill schema-required fields so a minimal form saves without errors.
        await createEventMut({
          ...rest,
          description: data.description || '',
          date: data.date || new Date().toISOString(),
          location: data.location || 'Sede da associação',
          slug: data.slug?.trim() || slugify(data.title),
          categoryId: String(data.categoryId),
          externalImage: imageUrl || data.externalImage,
          status: (data.status || 'published') as 'published' | 'draft',
        });
        logActivity('create', 'Evento', `Evento criado: ${data.title}`);
        return { success: true };
      } catch (e) {
        console.error("addEvent error:", e);
        return toActionResult(e);
      }
    },
    [createEventMut, logActivity]
  );

  const updateEvent = useCallback(
    async (id: string, data: Partial<EventCreateArgs>): Promise<ActionResult> => {
      try {
        // category is joined client-side for display; the validator rejects it
        const { imageUrl, status, category: _category, ...rest } =
          data as Partial<EventCreateArgs> & { category?: string };
        if (rest.categoryId) rest.categoryId = String(rest.categoryId);
        // '' means the admin removed the image; undefined means untouched
        if (imageUrl !== undefined) rest.externalImage = imageUrl;
        // '' also has to drop the stored file, which the read side prefers over the URL
        const clearStored = imageUrl === '';
        await updateEventMut({
          id: id as Id<"events">,
          ...rest,
          ...(status !== undefined ? { status: status as 'published' | 'draft' } : {}),
        });
        if (clearStored) await clearStorageMut({ id: id as Id<"events"> });
        logActivity('update', 'Evento', describeAction('Evento atualizado', id));
        return { success: true };
      } catch (e) {
        console.error("updateEvent error:", e);
        return toActionResult(e);
      }
    },
    [updateEventMut, clearStorageMut, logActivity, describeAction]
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteEventMut({ id: id as Id<"events"> });
        logActivity('delete', 'Evento', describeAction('Evento removido', id));
        return { success: true };
      } catch (e) {
        console.error("deleteEvent error:", e);
        return toActionResult(e);
      }
    },
    [deleteEventMut, logActivity, describeAction]
  );

  return { addEvent, updateEvent, deleteEvent };
}
