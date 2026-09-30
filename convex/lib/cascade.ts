import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { releaseUrl, swapUrl } from "./uploads";

/**
 * Delete an event and all related registrations + storage.
 */
export async function cascadeDeleteEvent(ctx: MutationCtx, eventId: Id<"events">) {
  const event = await ctx.db.get(eventId);
  if (!event) return;

  // Delete related registrations
  const registrations = await ctx.db
    .query("registrations")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();
  for (const reg of registrations) {
    await ctx.db.delete(reg._id);
  }

  // Clean up storage
  await releaseUrl(ctx, event.externalImage);
  if (event.image) {
    try { await ctx.storage.delete(event.image as Id<"_storage">); } catch (e) { console.error("Failed to delete storage:", e); }
  }

  await ctx.db.delete(eventId);
}

/**
 * Delete an album and all its gallery images + storage.
 */
export async function cascadeDeleteAlbum(ctx: MutationCtx, albumId: Id<"albums">) {
  const album = await ctx.db.get(albumId);
  if (!album) return;

  // Delete all gallery images and their storage
  const images = await ctx.db
    .query("galleryImages")
    .withIndex("by_album", (q) => q.eq("albumId", albumId))
    .collect();
  for (const img of images) {
    if (img.storageId) {
      try { await ctx.storage.delete(img.storageId); } catch (e) { console.error("Failed to delete storage:", e); }
    }
    await ctx.db.delete(img._id);
  }

  // Clean up cover storage
  await releaseUrl(ctx, album.externalCover);
  if (album.coverId) {
    try { await ctx.storage.delete(album.coverId as Id<"_storage">); } catch (e) { console.error("Failed to delete storage:", e); }
  }

  await ctx.db.delete(albumId);
}

/**
 * Clean up storage when deleting any entity with a storage field.
 * Pass the field name that contains the storage ID.
 */
export async function cleanupStorageOnDelete(
  ctx: MutationCtx,
  doc: Record<string, unknown>,
  storageFields: string[],
  externalFields: string[] = []
) {
  for (const field of storageFields) {
    if (doc[field] !== undefined && doc[field] !== null) {
      try { await ctx.storage.delete(doc[field] as Id<"_storage">); } catch (e) { console.error("Failed to delete storage:", e); }
    }
  }
  for (const field of externalFields) await releaseUrl(ctx, doc[field]);
}

/**
 * Clean up old storage when an image field is being replaced.
 */
export async function cleanupStorageOnUpdate(
  ctx: MutationCtx,
  existingDoc: Record<string, unknown>,
  newValue: unknown,
  field: string
) {
  if (newValue !== undefined && existingDoc[field] && existingDoc[field] !== newValue) {
    try { await ctx.storage.delete(existingDoc[field] as Id<"_storage">); } catch (e) { console.error("Failed to delete storage:", e); }
  }
}

/**
 * Keep an entity's image pair coherent on update. Reads prefer the storage id over the
 * external URL, so a new URL (or '' to remove the image) has to release the stored file,
 * otherwise the save succeeds and the old picture keeps showing. A new storage id releases
 * the previous one, and an uploaded URL that is replaced is released from the ledger
 * (convex/lib/uploads.ts). The admin form echoes the raw fields it loaded, so values equal to the
 * stored ones count as untouched. Mutates `updates` so the caller patches once.
 */
export async function reconcileImageUpdate(
  ctx: MutationCtx,
  existingDoc: Record<string, unknown> | null,
  updates: Record<string, unknown>,
  storageField: string,
  externalField: string
) {
  if (!existingDoc) return;
  const stored = existingDoc[storageField];
  const nextStored = updates[storageField];
  const storageChanged = nextStored !== undefined && nextStored !== stored;
  if (storageChanged) await cleanupStorageOnUpdate(ctx, existingDoc, nextStored, storageField);
  const nextExternal = updates[externalField];
  if (nextExternal === undefined || nextExternal === existingDoc[externalField]) return;
  // Both changed in one patch: the ledger still has to move from the old URL to the new
  await swapUrl(ctx, existingDoc[externalField], nextExternal);
  if (storageChanged || !stored) return;
  try { await ctx.storage.delete(stored as Id<"_storage">); } catch (e) { console.error("Failed to delete storage:", e); }
  // undefined in a patch removes the field
  updates[storageField] = undefined;
}
