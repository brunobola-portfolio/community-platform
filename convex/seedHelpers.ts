// Internal mutations/queries for seeding — no auth guards or rate limits
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { sanitizeContentServer } from "./lib/validation";

export const listCategories = internalQuery({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("categories").collect();
    },
});

export const createCategory = internalMutation({
    args: {
        name: v.string(),
        slug: v.string(),
        type: v.string(),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("categories")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
        if (existing) return existing._id;
        return await ctx.db.insert("categories", args);
    },
});

export const createEvent = internalMutation({
    args: {
        title: v.string(),
        description: v.string(),
        date: v.string(),
        location: v.string(),
        categoryId: v.string(),
        slug: v.string(),
        image: v.optional(v.id("_storage")),
        externalImage: v.optional(v.string()),
        status: v.union(v.literal("published"), v.literal("draft")),
        isHighlight: v.optional(v.boolean()),
        isTournament: v.optional(v.boolean()),
        tournamentType: v.optional(v.string()),
        entryPrice: v.optional(v.number()),
        maxParticipants: v.optional(v.number()),
        currentParticipants: v.optional(v.number()),
        registrationOpen: v.optional(v.boolean()),
        registrationFields: v.optional(v.array(v.object({
            id: v.string(),
            label: v.string(),
            type: v.string(),
            required: v.boolean(),
            placeholder: v.optional(v.string()),
        }))),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("events")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
        if (existing) return existing._id;
        const sanitizedDescription = sanitizeContentServer(args.description);
        return await ctx.db.insert("events", { ...args, description: sanitizedDescription });
    },
});

export const createPost = internalMutation({
    args: {
        title: v.string(),
        excerpt: v.string(),
        content: v.string(),
        author: v.string(),
        authorRole: v.optional(v.string()),
        authorAvatar: v.optional(v.string()),
        date: v.string(),
        readTime: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        categoryId: v.string(),
        slug: v.string(),
        coverImage: v.optional(v.id("_storage")),
        externalImage: v.optional(v.string()),
        published: v.boolean(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("posts")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
        if (existing) return existing._id;
        const sanitizedContent = sanitizeContentServer(args.content);
        return await ctx.db.insert("posts", { ...args, content: sanitizedContent });
    },
});

export const clearMembers = internalMutation({
    args: {},
    handler: async (ctx) => {
        const all = await ctx.db.query("members").collect();
        for (const m of all) {
            await ctx.db.delete(m._id);
        }
    },
});

export const createMember = internalMutation({
    args: {
        name: v.string(),
        role: v.string(),
        bio: v.optional(v.string()),
        photo: v.optional(v.id("_storage")),
        externalPhoto: v.optional(v.string()),
        group: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("members", args);
    },
});

export const createSponsor = internalMutation({
    args: {
        name: v.string(),
        tier: v.string(),
        logo: v.optional(v.id("_storage")),
        externalLogo: v.optional(v.string()),
        website: v.optional(v.string()),
        active: v.boolean(),
    },
    handler: async (ctx, args) => {
        // TODO: add index by_name_tier on sponsors for this query
        const existing = await ctx.db
            .query("sponsors")
            .filter((q) => q.and(
                q.eq(q.field("name"), args.name),
                q.eq(q.field("tier"), args.tier)
            ))
            .first();
        if (existing) return existing._id;
        return await ctx.db.insert("sponsors", args);
    },
});

export const createNotification = internalMutation({
    args: {
        title: v.string(),
        message: v.string(),
        type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("urgent")),
        target: v.union(v.literal("all"), v.literal("admin"), v.literal("user")),
    },
    handler: async (ctx, args) => {
        // TODO: add index by_title on notifications for this query
        const existing = await ctx.db
            .query("notifications")
            .filter((q) => q.eq(q.field("title"), args.title))
            .first();
        if (existing) return existing._id;
        return await ctx.db.insert("notifications", {
            ...args,
            read: false,
            timestamp: Date.now(),
        });
    },
});

export const createActionArea = internalMutation({
    args: {
        title: v.string(),
        subtitle: v.string(),
        description: v.string(),
        longDescription: v.string(),
        features: v.array(v.string()),
        externalImage: v.optional(v.string()),
        image: v.optional(v.id("_storage")),
        iconName: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        // TODO: add index by_title on actionAreas for this query
        const existing = await ctx.db
            .query("actionAreas")
            .filter((q) => q.eq(q.field("title"), args.title))
            .first();
        if (existing) return existing._id;
        return await ctx.db.insert("actionAreas", args);
    },
});

export const upsertStat = internalMutation({
    args: {
        label: v.string(),
        value: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        // TODO: use by_label index once added to schema
        const existing = await ctx.db
            .query("stats")
            .filter((q) => q.eq(q.field("label"), args.label))
            .first();
        if (existing) return existing._id;
        return await ctx.db.insert("stats", args);
    },
});

export const upsertSponsorTier = internalMutation({
    args: {
        name: v.string(),
        price: v.string(),
        benefits: v.array(v.string()),
        order: v.number(),
        color: v.optional(v.string()),
        textColor: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // TODO: add index by_name on sponsorTiers for this query
        const existing = await ctx.db
            .query("sponsorTiers")
            .filter((q) => q.eq(q.field("name"), args.name))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("sponsorTiers", args);
        }
    },
});

export const createDocument = internalMutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        fileId: v.optional(v.id("_storage")),
        externalUrl: v.optional(v.string()),
        category: v.string(),
        date: v.optional(v.string()),
        size: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // TODO: add composite index by_title_category on documents for this query
        const existing = await ctx.db
            .query("documents")
            .filter((q) => q.and(
                q.eq(q.field("title"), args.title),
                q.eq(q.field("category"), args.category)
            ))
            .first();
        if (existing) return existing._id;
        return await ctx.db.insert("documents", {
            ...args,
            uploadedAt: Date.now(),
        });
    },
});

export const updateSettings = internalMutation({
    args: {
        siteName: v.optional(v.string()),
        maintenanceMode: v.optional(v.boolean()),
        contactEmail: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        currentMandate: v.optional(v.string()),
        contentTone: v.optional(v.string()),
        defaultImageStyle: v.optional(v.string()),
        enableChatbot: v.optional(v.boolean()),
        chatModel: v.optional(v.string()),
        chatModelFallback: v.optional(v.string()),
        imageModel: v.optional(v.string()),
        thinkingBudget: v.optional(v.number()),
        aiSystemPromptExtra: v.optional(v.string()),
        aiAllowedTopics: v.optional(v.string()),
        aiForbiddenTopics: v.optional(v.string()),
        aiGuardrailsEnabled: v.optional(v.boolean()),
        imageResolution: v.optional(v.string()),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        mapsUrl: v.optional(v.string()),
        latitude: v.optional(v.string()),
        longitude: v.optional(v.string()),
        facebookPageId: v.optional(v.string()),
        facebookAccessToken: v.optional(v.string()),
        showChatbotBubble: v.optional(v.boolean()),
        ttsModel: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("settings").first();
        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("settings", {
                siteName: args.siteName ?? "ARCVA",
                maintenanceMode: args.maintenanceMode ?? false,
                contactEmail: args.contactEmail,
                logoUrl: args.logoUrl,
                currentMandate: args.currentMandate,
                contentTone: args.contentTone,
                defaultImageStyle: args.defaultImageStyle,
                enableChatbot: args.enableChatbot,
                chatModel: args.chatModel,
                chatModelFallback: args.chatModelFallback,
                imageModel: args.imageModel,
                thinkingBudget: args.thinkingBudget,
                aiSystemPromptExtra: args.aiSystemPromptExtra,
                aiAllowedTopics: args.aiAllowedTopics,
                aiForbiddenTopics: args.aiForbiddenTopics,
                aiGuardrailsEnabled: args.aiGuardrailsEnabled,
                imageResolution: args.imageResolution,
                phone: args.phone,
                address: args.address,
                mapsUrl: args.mapsUrl,
                latitude: args.latitude,
                longitude: args.longitude,
                facebookPageId: args.facebookPageId,
                facebookAccessToken: args.facebookAccessToken,
                showChatbotBubble: args.showChatbotBubble,
                ttsModel: args.ttsModel,
            });
        }
    },
});

export const generateUploadUrl = internalMutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// Fixes categoryId on posts/events by mapping slug -> real Convex category ID
export const fixCategories = internalMutation({
    args: {},
    handler: async (ctx) => {
        const categories = await ctx.db.query("categories").collect();

        // Slug -> expected category name (from mockData)
        const slugToCategoryMap: Record<string, string> = {};
        for (const [slug, cat] of [
            ["obras-pavilhao", "institucional"],
            ["desenv-recreativo", "institucional"],
            ["resumo-sueca", "lazer"],
            ["solidariedade", "solidariedade"],
            ["caminhada-natal-2025", "desporto"],
            ["torneio-sueca-2026", "lazer"],
            ["torneio-snooker-2026", "desporto"],
            ["workshop-artesanato-2026", "cultura"],
            ["torneio-chinquilho-2026", "cultura"],
            ["festa-verao-2026", "eventos"],
            ["torneio-futsal-2026", "desporto"],
            ["magusto-2025", "eventos"],
            ["zumba-2026", "desporto"],
            ["noite-fados-2026", "cultura"],
        ]) {
            slugToCategoryMap[slug] = cat;
        }

        const getCategoryId = (catSlug: string) => {
            const cat = categories.find(c => c.slug === catSlug);
            return cat ? cat._id : undefined;
        };

        let fixed = 0;

        // Fix posts
        const posts = await ctx.db.query("posts").collect();
        for (const post of posts) {
            const expectedSlug = slugToCategoryMap[post.slug];
            if (expectedSlug) {
                const correctId = getCategoryId(expectedSlug);
                if (correctId && String(post.categoryId) !== String(correctId)) {
                    await ctx.db.patch(post._id, { categoryId: String(correctId) });
                    fixed++;
                }
            }
        }

        // Fix events
        const events = await ctx.db.query("events").collect();
        for (const event of events) {
            const expectedSlug = slugToCategoryMap[event.slug];
            if (expectedSlug) {
                const correctId = getCategoryId(expectedSlug);
                if (correctId && String(event.categoryId) !== String(correctId)) {
                    await ctx.db.patch(event._id, { categoryId: String(correctId) });
                    fixed++;
                }
            }
        }

        return fixed;
    },
});

// Patches broken Unsplash URLs in existing DB records
export const fixBrokenImages = internalMutation({
    args: {},
    handler: async (ctx) => {
        const replacements: Record<string, string> = {
            "photo-1622634351318-75571615e51f": "photo-1581092160562-40aa08e78837",
            "photo-1605218457336-92748b9961f6": "photo-1511795409834-ef04bbd61622",
            "photo-1596727267123-e571e227d639": "photo-1511795409834-ef04bbd61622",
            "photo-1504711432869-efd597cdd043": "photo-1540575467063-178a50c2df87",
            "photo-1595240277332-9cb4a49931b6": "photo-1575224300306-1b8da36134ec",
            "photo-1459749411177-3c2ea81583aa": "photo-1511632765486-a01980e01a18",
            "photo-1516131206008-560d2697b913": "photo-1501281668745-f7f57925c3b4",
            "photo-1533174072545-e8d4aa97edf9": "photo-1540575467063-178a50c2df87",
            "photo-1598550874175-4d7112ee7f38": "photo-1438761681033-6461ffad8d80",
            "photo-1614850523296-d8c1af93d400": "photo-1540575467063-178a50c2df87",
        };

        const fixUrl = (url: string | undefined): string | undefined => {
            if (!url) return url;
            for (const [broken, fixed] of Object.entries(replacements)) {
                if (url.includes(broken)) return url.replace(broken, fixed);
            }
            return url;
        };

        let fixed = 0;

        // Fix posts
        const posts = await ctx.db.query("posts").collect();
        for (const post of posts) {
            const newImg = fixUrl(post.externalImage);
            if (newImg !== post.externalImage) {
                await ctx.db.patch(post._id, { externalImage: newImg });
                fixed++;
            }
        }

        // Fix events
        const events = await ctx.db.query("events").collect();
        for (const event of events) {
            const newImg = fixUrl(event.externalImage);
            if (newImg !== event.externalImage) {
                await ctx.db.patch(event._id, { externalImage: newImg });
                fixed++;
            }
        }

        // Fix members
        const members = await ctx.db.query("members").collect();
        for (const member of members) {
            const newPhoto = fixUrl(member.externalPhoto);
            if (newPhoto !== member.externalPhoto) {
                await ctx.db.patch(member._id, { externalPhoto: newPhoto });
                fixed++;
            }
        }

        // Fix sponsors
        const sponsors = await ctx.db.query("sponsors").collect();
        for (const sponsor of sponsors) {
            const newLogo = fixUrl(sponsor.externalLogo);
            if (newLogo !== sponsor.externalLogo) {
                await ctx.db.patch(sponsor._id, { externalLogo: newLogo });
                fixed++;
            }
        }

        return fixed;
    },
});

// Removes duplicate records from tables that lack unique indexes
export const dedup = internalMutation({
    args: {},
    handler: async (ctx) => {
        let totalRemoved = 0;

        // Sponsors: unique by name+tier
        {
            const all = await ctx.db.query("sponsors").collect();
            const seen = new Set<string>();
            for (const row of all) {
                const key = `${row.name}::${row.tier}`;
                if (seen.has(key)) { await ctx.db.delete(row._id); totalRemoved++; }
                else { seen.add(key); }
            }
        }

        // Notifications: unique by title
        {
            const all = await ctx.db.query("notifications").collect();
            const seen = new Set<string>();
            for (const row of all) {
                const key = row.title;
                if (seen.has(key)) { await ctx.db.delete(row._id); totalRemoved++; }
                else { seen.add(key); }
            }
        }

        // Documents: unique by title+category
        {
            const all = await ctx.db.query("documents").collect();
            const seen = new Set<string>();
            for (const row of all) {
                const key = `${row.title}::${row.category}`;
                if (seen.has(key)) { await ctx.db.delete(row._id); totalRemoved++; }
                else { seen.add(key); }
            }
        }

        return totalRemoved;
    },
});
