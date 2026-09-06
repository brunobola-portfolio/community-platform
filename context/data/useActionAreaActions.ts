import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { ActionAreaCreateArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** ActionArea wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useActionAreaActions({ logActivity, describeAction }: ActionDeps) {
  const createActionAreaMut = useMutation(api.actionAreas.create);
  const updateActionAreaMut = useMutation(api.actionAreas.update);
  const deleteActionAreaMut = useMutation(api.actionAreas.remove);

  const addActionArea = useCallback(
    async (data: ActionAreaCreateArgs): Promise<ActionResult> => {
      try {
        await createActionAreaMut({
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          longDescription: data.longDescription,
          features: data.features,
          // The admin form (MediaStudio) writes imageUrl; alias it to the Convex field
          externalImage: data.imageUrl || data.externalImage,
          iconName: data.iconName,
          order: data.order,
        });
        logActivity('create', 'Área de Atuação', `Área de atuação criada: ${data.title}`);
        return { success: true };
      } catch (e) {
        console.error("addActionArea error:", e);
        return toActionResult(e);
      }
    },
    [createActionAreaMut, logActivity]
  );

  const updateActionArea = useCallback(
    async (id: string, data: Partial<ActionAreaCreateArgs>): Promise<ActionResult> => {
      try {
        await updateActionAreaMut({
          id: id as Id<"actionAreas">,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          longDescription: data.longDescription,
          features: data.features,
          // imageUrl '' means the admin removed the image; undefined means untouched
          externalImage: data.imageUrl !== undefined ? data.imageUrl : data.externalImage,
          iconName: data.iconName,
          order: data.order,
        });
        logActivity('update', 'Área de Atuação', `Área de atuação atualizada: ${data.title || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateActionArea error:", e);
        return toActionResult(e);
      }
    },
    [updateActionAreaMut, logActivity]
  );

  const deleteActionArea = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteActionAreaMut({ id: id as Id<"actionAreas"> });
        logActivity('delete', 'Área de Atuação', describeAction('Área de atuação removida', id));
        return { success: true };
      } catch (e) {
        console.error("deleteActionArea error:", e);
        return toActionResult(e);
      }
    },
    [deleteActionAreaMut, logActivity, describeAction]
  );

  return { addActionArea, updateActionArea, deleteActionArea };
}
