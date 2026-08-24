import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { cascadeDeleteAlbum, cleanupStorageOnUpdate } from "./lib/cascade";
import { validateRequired, validateMaxLength } from "./lib/validation";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const albums = await ctx.db.query("albums").order("desc").collect();

        // Batch: fetch all gallery images once to avoid N+1 per-album queries
        const allImages = await ctx.db.query("galleryImages").collect();
        const imagesByAlbum = new Map<string, typeof allImages>();
        for (const img of allImages) {
            const key = String(img.albumId);
            const list = imagesByAlbum.get(key) ?? [];
            list.push(img);
            imagesByAlbum.set(key, list);
        }

        return Promise.all(
            albums.map(async (a) => {
                const photos = imagesByAlbum.get(String(a._id)) ?? [];

                const photoUrls = await Promise.all(
                    photos.map(async (p) => p.storageId ? await ctx.storage.getUrl(p.storageId) : p.externalUrl)
                );

                return {
                    ...a,
                    coverUrl: a.coverId ? await ctx.storage.getUrl(a.coverId) : a.externalCover,
                    photos: photoUrls.filter(url => url !== null),
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
                coverUrl: a.coverId ? await ctx.storage.getUrl(a.coverId) : a.externalCover,
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

        const images = await ctx.db
            .query("galleryImages")
            .withIndex("by_album", (q) => q.eq("albumId", args.id))
            .collect();

        const imagesWithUrls = await Promise.all(
            images.map(async (img) => ({
                ...img,
                url: img.storageId ? await ctx.storage.getUrl(img.storageId) : img.externalUrl,
            }))
        );

        return {
            ...album,
            coverUrl: album.coverId ? await ctx.storage.getUrl(album.coverId) : album.externalCover,
            images: imagesWithUrls,
            photos: imagesWithUrls.map(i => i.url).filter(u => u !== null) // Shim for frontend compatibility
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
        return await ctx.db.insert("galleryImages", {
            ...args,
            uploadedAt: Date.now(),
        });
    },
});

// Replace an album's photo set with the list managed in the admin form.
// Existing entries are matched by their resolved display URL: kept when still
// listed, deleted (with storage cleanup) when removed; new URLs are inserted
// as external images.
export const setImages = mutation({
    args: {
        albumId: v.id("albums"),
        photos: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        for (const url of args.photos) validateMaxLength(url, "foto", 2000);

        const existing = await ctx.db
            .query("galleryImages")
            .withIndex("by_album", (q) => q.eq("albumId", args.albumId))
            .collect();

        const withUrls = await Promise.all(existing.map(async (img) => ({
            img,
            url: img.storageId ? await ctx.storage.getUrl(img.storageId) : (img.externalUrl ?? null),
        })));

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
        for (const url of wanted) {
            await ctx.db.insert("galleryImages", {
                albumId: args.albumId,
                externalUrl: url,
                uploadedAt: Date.now(),
            });
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
