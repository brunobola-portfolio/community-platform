import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { CategoryCreateArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** Category wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useCategoryActions({ logActivity, describeAction }: ActionDeps) {
  const createCategoryMut = useMutation(api.categories.create);
  const updateCategoryMut = useMutation(api.categories.update);
  const deleteCategoryMut = useMutation(api.categories.remove);

  const addCategory = useCallback(
    async (data: Partial<CategoryCreateArgs> & { name: string }): Promise<ActionResult> => {
      try {
        const slug = (data.slug ?? data.name)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        await createCategoryMut({
          name: data.name,
          slug,
          type: data.type ?? "general",
          color: data.color,
        });
        logActivity('create', 'Categoria', `Categoria criada: ${data.name}`);
        return { success: true };
      } catch (e) {
        console.error("addCategory error:", e);
        return toActionResult(e);
      }
    },
    [createCategoryMut, logActivity]
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<CategoryCreateArgs>): Promise<ActionResult> => {
      try {
        await updateCategoryMut({ id: id as Id<"categories">, ...data });
        logActivity('update', 'Categoria', `Categoria atualizada: ${data.name || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateCategory error:", e);
        return toActionResult(e);
      }
    },
    [updateCategoryMut, logActivity]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<{ success: boolean; message: string }> => {
      try {
        await deleteCategoryMut({ id: id as Id<"categories"> });
        logActivity('delete', 'Categoria', describeAction('Categoria removida', id));
        return { success: true, message: "OK" };
      } catch (e) {
        console.error("deleteCategory error:", e);
        const message = e instanceof Error ? e.message : "Erro";
        return { success: false, message };
      }
    },
    [deleteCategoryMut, logActivity, describeAction]
  );

  return { addCategory, updateCategory, deleteCategory };
}
