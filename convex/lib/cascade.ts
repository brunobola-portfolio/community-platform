import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

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
  storageFields: string[]
) {
  for (const field of storageFields) {
    if (doc[field] !== undefined && doc[field] !== null) {
      try { await ctx.storage.delete(doc[field] as Id<"_storage">); } catch (e) { console.error("Failed to delete storage:", e); }
    }
  }
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
