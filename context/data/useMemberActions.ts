import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { MemberCreateArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** Member wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useMemberActions({ logActivity, describeAction }: ActionDeps) {
  const createMemberMut = useMutation(api.members.create);
  const clearStorageMut = useMutation(api.members.clearStorageImage);
  const updateMemberMut = useMutation(api.members.update);
  const deleteMemberMut = useMutation(api.members.remove);

  const addMember = useCallback(
    async (data: MemberCreateArgs): Promise<ActionResult> => {
      try {
        const { photoUrl, ...rest } = data;
        await createMemberMut({
          ...rest,
          externalPhoto: photoUrl || data.externalPhoto,
        });
        logActivity('create', 'Membro', `Membro criado: ${data.name}`);
        return { success: true };
      } catch (e) {
        console.error("addMember error:", e);
        return toActionResult(e);
      }
    },
    [createMemberMut, logActivity]
  );

  const updateMember = useCallback(
    async (id: string, data: Partial<MemberCreateArgs>): Promise<ActionResult> => {
      try {
        const { photoUrl, ...rest } = data;
        if (photoUrl !== undefined) rest.externalPhoto = photoUrl;
        // '' also has to drop the stored file, which the read side prefers over the URL
        const clearStored = photoUrl === '';
        await updateMemberMut({ id: id as Id<"members">, ...rest });
        if (clearStored) await clearStorageMut({ id: id as Id<"members"> });
        logActivity('update', 'Membro', `Membro atualizado: ${data.name || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateMember error:", e);
        return toActionResult(e);
      }
    },
    [updateMemberMut, clearStorageMut, logActivity]
  );

  const deleteMember = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteMemberMut({ id: id as Id<"members"> });
        logActivity('delete', 'Membro', describeAction('Membro removido', id));
        return { success: true };
      } catch (e) {
        console.error("deleteMember error:", e);
        return toActionResult(e);
      }
    },
    [deleteMemberMut, logActivity, describeAction]
  );

  return { addMember, updateMember, deleteMember };
}
