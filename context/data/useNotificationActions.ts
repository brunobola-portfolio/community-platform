import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { NotificationCreateArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** Notification wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useNotificationActions({ logActivity, describeAction }: ActionDeps) {
  const createNotifMut = useMutation(api.notifications.create);
  const updateNotifMut = useMutation(api.notifications.update);
  const deleteNotifMut = useMutation(api.notifications.remove);

  const sendNotification = useCallback(
    async (notif: NotificationCreateArgs): Promise<ActionResult> => {
      try {
        await createNotifMut(notif);
        logActivity('create', 'Notificação', `Notificação enviada: ${notif.title}`);
        return { success: true };
      } catch (e) {
        console.error("sendNotification error:", e);
        return toActionResult(e);
      }
    },
    [createNotifMut, logActivity]
  );

  const updateNotification = useCallback(
    async (id: string, data: Partial<NotificationCreateArgs & { read?: boolean }>): Promise<ActionResult> => {
      try {
        await updateNotifMut({ id: id as Id<"notifications">, ...data });
        logActivity('update', 'Notificação', describeAction('Notificação atualizada', id));
        return { success: true };
      } catch (e) {
        console.error("updateNotification error:", e);
        return toActionResult(e);
      }
    },
    [updateNotifMut, logActivity, describeAction]
  );

  const deleteNotification = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteNotifMut({ id: id as Id<"notifications"> });
        logActivity('delete', 'Notificação', describeAction('Notificação removida', id));
        return { success: true };
      } catch (e) {
        console.error("deleteNotification error:", e);
        return toActionResult(e);
      }
    },
    [deleteNotifMut, logActivity, describeAction]
  );

  return { sendNotification, updateNotification, deleteNotification };
}
