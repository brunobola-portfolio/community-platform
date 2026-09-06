import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { MilestoneCreateArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** Milestone wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useMilestoneActions({ logActivity, describeAction }: ActionDeps) {
  const createMilestoneMut = useMutation(api.milestones.create);
  const updateMilestoneMut = useMutation(api.milestones.update);
  const deleteMilestoneMut = useMutation(api.milestones.remove);

  const addMilestone = useCallback(
    async (data: MilestoneCreateArgs): Promise<ActionResult> => {
      try {
        const { imageUrl, ...rest } = data;
        await createMilestoneMut({
          ...rest,
          year: Number(data.year) || new Date().getFullYear(),
          order: Number(data.order) || 1,
          externalImage: imageUrl || data.externalImage,
        });
        logActivity('create', 'Marco Histórico', `Marco criado: ${data.title}`);
        return { success: true };
      } catch (e) {
        console.error("addMilestone error:", e);
        return toActionResult(e);
      }
    },
    [createMilestoneMut, logActivity]
  );

  const updateMilestone = useCallback(
    async (id: string, data: Partial<MilestoneCreateArgs>): Promise<ActionResult> => {
      try {
        const { imageUrl, ...rest } = data;
        if (rest.year !== undefined) rest.year = Number(rest.year);
        if (rest.order !== undefined) rest.order = Number(rest.order);
        // '' means the admin removed the image; undefined means untouched
        if (imageUrl !== undefined) rest.externalImage = imageUrl;
        await updateMilestoneMut({ id: id as Id<"milestones">, ...rest });
        logActivity('update', 'Marco Histórico', `Marco atualizado: ${data.title || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateMilestone error:", e);
        return toActionResult(e);
      }
    },
    [updateMilestoneMut, logActivity]
  );

  const deleteMilestone = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteMilestoneMut({ id: id as Id<"milestones"> });
        logActivity('delete', 'Marco Histórico', describeAction('Marco removido', id));
        return { success: true };
      } catch (e) {
        console.error("deleteMilestone error:", e);
        return toActionResult(e);
      }
    },
    [deleteMilestoneMut, logActivity, describeAction]
  );

  return { addMilestone, updateMilestone, deleteMilestone };
}
