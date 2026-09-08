import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { PostCreateArgs } from './types';
import { toActionResult, excerptFromContent } from './helpers';
import { slugify } from '../../utils/text';
import type { ActionDeps } from './deps';

/** Post wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function usePostActions({ logActivity, describeAction }: ActionDeps) {
  const createPostMut = useMutation(api.posts.create);
  const clearStorageMut = useMutation(api.posts.clearStorageImage);
  const updatePostMut = useMutation(api.posts.update);
  const deletePostMut = useMutation(api.posts.remove);

  const addPost = useCallback(
    async (data: PostCreateArgs): Promise<ActionResult> => {
      try {
        // category/coverImageUrl are joined client-side; the validator rejects them
        const { coverUrl, category: _category, coverImageUrl: _cover, ...rest } =
          data as PostCreateArgs & { category?: string; coverImageUrl?: string };
        // Fill schema-required fields so a minimal form (title + content) saves.
        await createPostMut({
          ...rest,
          author: data.author?.trim() || 'Direção',
          excerpt: data.excerpt?.trim() || excerptFromContent(data.content || '') || data.title,
          date: data.date || new Date().toISOString(),
          slug: data.slug?.trim() || slugify(data.title),
          content: data.content || '',
          categoryId: String(data.categoryId),
          published: data.published !== undefined ? data.published : true,
          externalImage: coverUrl || data.externalImage,
        });
        logActivity('create', 'Notícia', `Notícia criada: ${data.title}`);
        return { success: true };
      } catch (e) {
        console.error("addPost error:", e);
        return toActionResult(e);
      }
    },
    [createPostMut, logActivity]
  );

  const updatePost = useCallback(
    async (id: string, data: Partial<PostCreateArgs>): Promise<ActionResult> => {
      try {
        // category/coverImageUrl are joined client-side; the validator rejects them
        const { coverUrl, category: _category, coverImageUrl: _cover, ...rest } =
          data as Partial<PostCreateArgs> & { category?: string; coverImageUrl?: string };
        if (coverUrl !== undefined) rest.externalImage = coverUrl;
        // '' also has to drop the stored file, which the read side prefers over the URL
        const clearStored = coverUrl === '';
        if (rest.categoryId) rest.categoryId = String(rest.categoryId);
        await updatePostMut({ id: id as Id<"posts">, ...rest });
        if (clearStored) await clearStorageMut({ id: id as Id<"posts"> });
        logActivity('update', 'Notícia', describeAction('Notícia atualizada', id));
        return { success: true };
      } catch (e) {
        console.error("updatePost error:", e);
        return toActionResult(e);
      }
    },
    [updatePostMut, clearStorageMut, logActivity, describeAction]
  );

  const deletePost = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deletePostMut({ id: id as Id<"posts"> });
        logActivity('delete', 'Notícia', describeAction('Notícia removida', id));
        return { success: true };
      } catch (e) {
        console.error("deletePost error:", e);
        return toActionResult(e);
      }
    },
    [deletePostMut, logActivity, describeAction]
  );

  return { addPost, updatePost, deletePost };
}
