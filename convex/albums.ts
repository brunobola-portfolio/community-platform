import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";
import { cascadeDeleteAlbum, cleanupStorageOnUpdate } from "./lib/cascade";
import { validateRequired, validateMaxLength } from "./lib/validation";

type Ctx = QueryCtx | MutationCtx;

async function imageUrl(ctx: Ctx, img: Doc<"galleryImages">): Promise<string | null> {
    return img.storageId ? await ctx.storage.getUrl(img.storageId) : (img.externalUrl ?? null);
}

// Cover precedence: a photo of the album chosen in the manager, then an
// uploaded cover, then an external URL
async function resolveCover(ctx: Ctx, album: Doc<"albums">): Promise<string | null | undefined> {
    if (album.coverImageId) {
        const img = await ctx.db.get(album.coverImageId);
        if (img) return imageUrl(ctx, img);
    }
    if (album.coverId) return ctx.storage.getUrl(album.coverId);
    return album.externalCover;
}

// Legacy rows have no order; keep upload chronology for them
function sortImages(images: Doc<"galleryImages">[]): Doc<"galleryImages">[] {
    return [...images].sort((a, b) => (a.order ?? a.uploadedAt) - (b.order ?? b.uploadedAt));
}

async function albumImages(ctx: Ctx, albumId: Id<"albums">): Promise<Doc<"galleryImages">[]> {
    const images = await ctx.db
        .query("galleryImages")
        .withIndex("by_album", (q) => q.eq("albumId", albumId))
        .collect();
    return sortImages(images);
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const albums = await ctx.db.query("albums").order("desc").collect();

        // Batch: fetch all gallery images once to avoid N+1 per-album queries
        const allImages = await ctx.db.query("galleryImages").collect();
        const imagesByAlbum = new Map<string, Doc<"galleryImages">[]>();
        for (const img of allImages) {
            const key = String(img.albumId);
            const bucket = imagesByAlbum.get(key) ?? [];
            bucket.push(img);
            imagesByAlbum.set(key, bucket);
        }

        return Promise.all(
            albums.map(async (a) => {
                const photos = sortImages(imagesByAlbum.get(String(a._id)) ?? []);
                const photoUrls = await Promise.all(photos.map((p) => imageUrl(ctx, p)));
                return {
                    ...a,
                    coverUrl: await resolveCover(ctx, a),
                    photos: photoUrls.filter((url): url is string => url !== null),
                };
            })
        );
    },
});

export const listSummary = query({
    args: {},
    handler: async (ctx) => {
        const albums = await ctx.db.query("albums").order("desc").collect();

        // Batch: fetch all gallery images once, group counts by albumId
        const allImages = await ctx.db.query("galleryImages").collect();
        const countByAlbum = new Map<string, number>();
        for (const img of allImages) {
            const key = String(img.albumId);
            countByAlbum.set(key, (countByAlbum.get(key) ?? 0) + 1);
        }

        return Promise.all(
            albums.map(async (a) => ({
                ...a,
                coverUrl: await resolveCover(ctx, a),
                photoCount: countByAlbum.get(String(a._id)) ?? 0,
            }))
        );
    },
});

export const getWithImages = query({
    args: { id: v.id("albums") },
    handler: async (ctx, args) => {
        const album = await ctx.db.get(args.id);
        if (!album) return null;

        const images = await albumImages(ctx, args.id);
        const imagesWithUrls = await Promise.all(
            images.map(async (img) => ({ ...img, url: await imageUrl(ctx, img) }))
        );

        return {
            ...album,
            coverUrl: await resolveCover(ctx, album),
            images: imagesWithUrls,
            photos: imagesWithUrls.map((i) => i.url).filter((u): u is string => u !== null),
        };
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        date: v.string(),
        coverId: v.optional(v.id("_storage")),
        externalCover: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        validateRequired(args, ["title", "date"]);
        validateMaxLength(args.title, "title", 200);
        if (args.description) validateMaxLength(args.description, "description", 2000);
        return await ctx.db.insert("albums", args);
    },
});

export const addImage = mutation({
    args: {
        albumId: v.id("albums"),
        storageId: v.optional(v.id("_storage")),
        externalUrl: v.optional(v.string()),
        caption: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.caption) validateMaxLength(args.caption, "caption", 500);
        if (args.externalUrl) validateMaxLength(args.externalUrl, "foto", 2000);
        if (!args.storageId && !args.externalUrl) throw new Error("Foto sem ficheiro nem URL.");
        const existing = await albumImages(ctx, args.albumId);
        const last = existing[existing.length - 1];
        const order = last ? (last.order ?? last.uploadedAt) + 1 : 0;
        return await ctx.db.insert("galleryImages", { ...args, order, uploadedAt: Date.now() });
    },
});

export const updateImage = mutation({
    args: { id: v.id("galleryImages"), caption: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.caption) validateMaxLength(args.caption, "caption", 500);
        await ctx.db.patch(args.id, { caption: args.caption?.trim() || undefined });
    },
});

export const removeImage = mutation({
    args: { id: v.id("galleryImages") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const img = await ctx.db.get(args.id);
        if (!img) return;
        if (img.storageId) {
            try { await ctx.storage.delete(img.storageId); } catch (e) {
                console.warn("Storage delete falhou (galleryImage):", e);
            }
        }
        const album = await ctx.db.get(img.albumId);
        if (album?.coverImageId === args.id) await ctx.db.patch(album._id, { coverImageId: undefined });
        await ctx.db.delete(args.id);
    },
});

// Persist a full ordering from the manager (drag/arrow moves send the whole list)
export const reorderImages = mutation({
    args: { albumId: v.id("albums"), ids: v.array(v.id("galleryImages")) },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const images = await albumImages(ctx, args.albumId);
        const allowed = new Set(images.map((i) => String(i._id)));
        let position = 0;
        for (const id of args.ids) {
            if (!allowed.has(String(id))) continue;
            await ctx.db.patch(id, { order: position });
            position += 1;
        }
    },
});

export const setCoverImage = mutation({
    args: { albumId: v.id("albums"), imageId: v.union(v.id("galleryImages"), v.null()) },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.imageId) {
            const img = await ctx.db.get(args.imageId);
            if (!img || img.albumId !== args.albumId) throw new Error("A foto não pertence a este álbum.");
        }
        await ctx.db.patch(args.albumId, { coverImageId: args.imageId ?? undefined });
    },
});

// Replace an album's photo set with a list of URLs (seed and legacy admin
// form). Existing entries are matched by their resolved display URL: kept
// when still listed, deleted (with storage cleanup) when removed; new URLs
// are inserted as external images.
export const setImages = mutation({
    args: {
        albumId: v.id("albums"),
        photos: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        for (const url of args.photos) validateMaxLength(url, "foto", 2000);

        const existing = await albumImages(ctx, args.albumId);
        const withUrls = await Promise.all(existing.map(async (img) => ({ img, url: await imageUrl(ctx, img) })));

        const wanted = new Set(args.photos.filter(Boolean));
        for (const { img, url } of withUrls) {
            if (url && wanted.has(url)) {
                wanted.delete(url);
                continue;
            }
            if (img.storageId) {
                try { await ctx.storage.delete(img.storageId); } catch (e) {
                    console.warn("Storage delete falhou (galleryImage):", e);
                }
            }
            await ctx.db.delete(img._id);
        }
        let order = existing.length;
        for (const url of wanted) {
            await ctx.db.insert("galleryImages", { albumId: args.albumId, externalUrl: url, order, uploadedAt: Date.now() });
            order += 1;
        }
    },
});

export const update = mutation({
    args: {
        id: v.id("albums"),
        title: v.optional(v.string()),
        date: v.optional(v.string()),
        coverId: v.optional(v.id("_storage")),
        externalCover: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.title) validateMaxLength(args.title, "title", 200);
        if (args.description) validateMaxLength(args.description, "description", 2000);
        const { id, ...updates } = args;
        if (updates.coverId !== undefined) {
            const existing = await ctx.db.get(id);
            if (existing) {
                await cleanupStorageOnUpdate(ctx, existing, updates.coverId, "coverId");
            }
        }
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("albums") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await cascadeDeleteAlbum(ctx, args.id);
    },
});

export const clearStorageImage = mutation({
    args: { id: v.id("albums") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const album = await ctx.db.get(args.id);
        if (album && album.coverId) {
            try { await ctx.storage.delete(album.coverId); } catch (e) { console.error("Failed to delete storage:", e); }
            const { coverId, ...rest } = album;
            await ctx.db.replace(args.id, rest);
        }
    },
});
