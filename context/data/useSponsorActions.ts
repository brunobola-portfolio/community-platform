import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { SponsorCreateArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** Sponsor wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useSponsorActions({ logActivity, describeAction }: ActionDeps) {
  const createSponsorMut = useMutation(api.sponsors.create);
  const updateSponsorMut = useMutation(api.sponsors.update);
  const deleteSponsorMut = useMutation(api.sponsors.remove);

  const addSponsor = useCallback(
    async (data: SponsorCreateArgs): Promise<ActionResult> => {
      try {
        const { logoUrl, ...rest } = data;
        await createSponsorMut({
          ...rest,
          externalLogo: logoUrl || data.externalLogo,
          tier: data.tier.toLowerCase(),
        });
        logActivity('create', 'Parceiro', `Parceiro criado: ${data.name}`);
        return { success: true };
      } catch (e) {
        console.error("addSponsor error:", e);
        return toActionResult(e);
      }
    },
    [createSponsorMut, logActivity]
  );

  const updateSponsor = useCallback(
    async (id: string, data: Partial<SponsorCreateArgs>): Promise<ActionResult> => {
      try {
        const { logoUrl, ...rest } = data;
        if (logoUrl !== undefined) rest.externalLogo = logoUrl;
        await updateSponsorMut({ id: id as Id<"sponsors">, ...rest });
        logActivity('update', 'Parceiro', `Parceiro atualizado: ${data.name || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateSponsor error:", e);
        return toActionResult(e);
      }
    },
    [updateSponsorMut, logActivity]
  );

  const deleteSponsor = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteSponsorMut({ id: id as Id<"sponsors"> });
        logActivity('delete', 'Parceiro', describeAction('Parceiro removido', id));
        return { success: true };
      } catch (e) {
        console.error("deleteSponsor error:", e);
        return toActionResult(e);
      }
    },
    [deleteSponsorMut, logActivity, describeAction]
  );

  return { addSponsor, updateSponsor, deleteSponsor };
}
