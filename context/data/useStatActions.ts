import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { StatUpsertArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** Stat wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useStatActions({ logActivity, describeAction }: ActionDeps) {
  const upsertStatMut = useMutation(api.stats.upsert);
  const deleteStatMut = useMutation(api.stats.remove);

  const upsertStat = useCallback(
    async (data: StatUpsertArgs): Promise<ActionResult> => {
      try {
        await upsertStatMut({
          ...data,
          id: data.id ? data.id as Id<"stats"> : undefined,
        });
        logActivity('update', 'Estatística', `Estatística atualizada: ${data.label}`);
        return { success: true };
      } catch (e) {
        console.error("upsertStat error:", e);
        return toActionResult(e);
      }
    },
    [upsertStatMut, logActivity]
  );

  const deleteStat = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteStatMut({ id: id as Id<"stats"> });
        logActivity('delete', 'Estatística', describeAction('Estatística removida', id));
        return { success: true };
      } catch (e) {
        console.error("deleteStat error:", e);
        return toActionResult(e);
      }
    },
    [deleteStatMut, logActivity, describeAction]
  );

  return { upsertStat, deleteStat };
}
