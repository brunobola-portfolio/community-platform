import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ActionResult } from '../../types';
import type { AlbumCreateArgs } from './types';
import { toActionResult } from './helpers';
import type { ActionDeps } from './deps';

/** Album wrappers: Convex mutations behind an ActionResult and an activity log entry. */
export function useAlbumActions({ logActivity, describeAction }: ActionDeps) {
  const createAlbumMut = useMutation(api.albums.create);
  const clearStorageMut = useMutation(api.albums.clearStorageImage);
  const updateAlbumMut = useMutation(api.albums.update);
  const deleteAlbumMut = useMutation(api.albums.remove);
  const setAlbumImagesMut = useMutation(api.albums.setImages);

  const createAlbum = useCallback(
    async (album: AlbumCreateArgs): Promise<ActionResult> => {
      try {
        const albumId = await createAlbumMut({
          title: album.title,
          date: album.date,
          // The admin form (MediaStudio) writes coverUrl; alias it to the Convex field
          externalCover: album.coverUrl || album.externalCover,
          description: album.description,
        });
        if (album.photos && album.photos.length > 0) {
          await setAlbumImagesMut({ albumId, photos: album.photos });
        }
        logActivity('create', 'Álbum', `Álbum criado: ${album.title}`);
        return { success: true };
      } catch (e) {
        console.error("createAlbum error:", e);
        return toActionResult(e);
      }
    },
    [createAlbumMut, setAlbumImagesMut, logActivity]
  );

  const updateAlbum = useCallback(
    async (id: string, data: Partial<AlbumCreateArgs>): Promise<ActionResult> => {
      try {
        await updateAlbumMut({
          id: id as Id<"albums">,
          title: data.title,
          date: data.date,
          // coverUrl '' means the admin removed the cover; undefined means untouched
          externalCover: data.coverUrl !== undefined ? data.coverUrl : data.externalCover,
          description: data.description,
        });
        if (data.coverUrl === '') await clearStorageMut({ id: id as Id<"albums"> });
        if (data.photos !== undefined) {
          await setAlbumImagesMut({ albumId: id as Id<"albums">, photos: data.photos });
        }
        logActivity('update', 'Álbum', `Álbum atualizado: ${data.title || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateAlbum error:", e);
        return toActionResult(e);
      }
    },
    [updateAlbumMut, setAlbumImagesMut, clearStorageMut, logActivity]
  );

  const deleteAlbum = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteAlbumMut({ id: id as Id<"albums"> });
        logActivity('delete', 'Álbum', describeAction('Álbum removido', id));
        return { success: true };
      } catch (e) {
        console.error("deleteAlbum error:", e);
        return toActionResult(e);
      }
    },
    [deleteAlbumMut, logActivity, describeAction]
  );

  return { createAlbum, updateAlbum, deleteAlbum };
}
