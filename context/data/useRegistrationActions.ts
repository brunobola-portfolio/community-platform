import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { RegistrationCreateArgs } from './types';
import { toActionResult } from './helpers';

/** Registration wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useRegistrationActions() {
  const createRegMut = useMutation(api.registrations.create);
  const updateRegStatusMut = useMutation(api.registrations.updateStatus);

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

  return { addRegistration, updateRegistrationStatus };
}
