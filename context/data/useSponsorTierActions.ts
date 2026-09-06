import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { SponsorTierUpsertArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** SponsorTier wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useSponsorTierActions({ logActivity, describeAction }: ActionDeps) {
  const upsertSponsorTierMut = useMutation(api.sponsorTiers.upsert);
  const deleteSponsorTierMut = useMutation(api.sponsorTiers.remove);

  const upsertSponsorTier = useCallback(
    async (data: SponsorTierUpsertArgs): Promise<ActionResult> => {
      try {
        await upsertSponsorTierMut({
          ...data,
          id: data.id ? data.id as Id<"sponsorTiers"> : undefined,
        });
        logActivity('update', 'Nível de Parceiro', `Nível de parceria atualizado: ${data.name}`);
        return { success: true };
      } catch (e) {
        console.error("upsertSponsorTier error:", e);
        return toActionResult(e);
      }
    },
    [upsertSponsorTierMut, logActivity]
  );

  const deleteSponsorTier = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteSponsorTierMut({ id: id as Id<"sponsorTiers"> });
        logActivity('delete', 'Nível de Parceiro', describeAction('Nível de parceria removido', id));
        return { success: true };
      } catch (e) {
        console.error("deleteSponsorTier error:", e);
        return toActionResult(e);
      }
    },
    [deleteSponsorTierMut, logActivity, describeAction]
  );

  return { upsertSponsorTier, deleteSponsorTier };
}
