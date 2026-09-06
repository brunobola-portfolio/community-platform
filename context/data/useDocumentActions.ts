import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { DocumentCreateArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** Document wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useDocumentActions({ logActivity, describeAction }: ActionDeps) {
  const createDocMut = useMutation(api.documents.create);
  const updateDocMut = useMutation(api.documents.update);
  const deleteDocMut = useMutation(api.documents.remove);

  const addDocument = useCallback(
    async (doc: DocumentCreateArgs): Promise<ActionResult> => {
      try {
        const { fileId, ...rest } = doc;
        await createDocMut({
          ...rest,
          fileId: fileId ? fileId as Id<"_storage"> : undefined,
        });
        logActivity('create', 'Documento', `Documento carregado: ${doc.title}`);
        return { success: true };
      } catch (e) {
        console.error("addDocument error:", e);
        return toActionResult(e);
      }
    },
    [createDocMut, logActivity]
  );

  const updateDocument = useCallback(
    async (id: string, doc: Partial<DocumentCreateArgs>): Promise<ActionResult> => {
      try {
        const { fileId, ...rest } = doc;
        await updateDocMut({
          id: id as Id<"documents">,
          ...rest,
          ...(fileId !== undefined ? { fileId: fileId as Id<"_storage"> } : {}),
        });
        logActivity('update', 'Documento', `Documento atualizado: ${doc.title || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateDocument error:", e);
        return toActionResult(e);
      }
    },
    [updateDocMut, logActivity]
  );

  const deleteDocument = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteDocMut({ id: id as Id<"documents"> });
        logActivity('delete', 'Documento', describeAction('Documento removido', id));
        return { success: true };
      } catch (e) {
        console.error("deleteDocument error:", e);
        return toActionResult(e);
      }
    },
    [deleteDocMut, logActivity, describeAction]
  );

  return { addDocument, updateDocument, deleteDocument };
}
