import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult, RegistrationStatus } from '../../types';
import type { RegistrationCreateArgs } from './types';
import { toActionResult } from './helpers';

/** Registration wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useRegistrationActions() {
  const createRegMut = useMutation(api.registrations.create);
  const updateRegStatusMut = useMutation(api.registrations.updateStatus);
  const bulkStatusMut = useMutation(api.registrations.bulkUpdateStatus);
  const removeRegMut = useMutation(api.registrations.remove);

  const addRegistration = useCallback(
    async (data: RegistrationCreateArgs): Promise<ActionResult> => {
      try {
        await createRegMut({
          ...data,
          eventId: data.eventId as Id<"events">,
          customData: data.customData as Record<string, string | number | boolean> | undefined,
        });
        return { success: true };
      } catch (e) {
        console.error("addRegistration error:", e);
        return toActionResult(e);
      }
    },
    [createRegMut]
  );

  const updateRegistrationStatus = useCallback(
    async (id: string, status: string, _paymentStatus?: string): Promise<ActionResult> => {
      try {
        await updateRegStatusMut({ id: id as Id<"registrations">, status: status as "pending" | "confirmed" | "cancelled" });
        return { success: true };
      } catch (e) {
        console.error("updateRegistrationStatus error:", e);
        return toActionResult(e);
      }
    },
    [updateRegStatusMut]
  );

  const bulkUpdateRegistrationStatus = useCallback(
    async (ids: string[], status: RegistrationStatus): Promise<ActionResult> => {
      try {
        await bulkStatusMut({ ids: ids as Id<"registrations">[], status });
        return { success: true };
      } catch (e) {
        return toActionResult(e);
      }
    },
    [bulkStatusMut]
  );

  const removeRegistration = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await removeRegMut({ id: id as Id<"registrations"> });
        return { success: true };
      } catch (e) {
        return toActionResult(e);
      }
    },
    [removeRegMut]
  );

  return { addRegistration, updateRegistrationStatus, bulkUpdateRegistrationStatus, removeRegistration };
}
