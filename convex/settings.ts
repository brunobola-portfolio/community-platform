import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, isAdmin } from "./lib/auth";
import { validateMaxLength } from "./lib/validation";

export const getPublic = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("settings").first();
        if (!settings) return null;
        return {
            siteName: settings.siteName,
            maintenanceMode: settings.maintenanceMode,
            contactEmail: settings.contactEmail,
            logoUrl: settings.logoUrl,
            currentMandate: settings.currentMandate,
            siteFullName: settings.siteFullName,
            locality: settings.locality,
            region: settings.region,
            foundedYear: settings.foundedYear,
            heroTagline: settings.heroTagline,
            heroSubtitle: settings.heroSubtitle,
            historyIntro: settings.historyIntro,
            historyQuote: settings.historyQuote,
            venueName: settings.venueName,
            venueDescription: settings.venueDescription,
            foundersNote: settings.foundersNote,
            contentTone: settings.contentTone,
            defaultImageStyle: settings.defaultImageStyle,
            enableChatbot: settings.enableChatbot,
            chatModel: settings.chatModel,
            chatModelFallback: settings.chatModelFallback,
            imageModel: settings.imageModel,
            thinkingBudget: settings.thinkingBudget,
            aiAllowedTopics: settings.aiAllowedTopics,
            aiForbiddenTopics: settings.aiForbiddenTopics,
            aiGuardrailsEnabled: settings.aiGuardrailsEnabled,
            imageResolution: settings.imageResolution,
            phone: settings.phone,
            openingHours: settings.openingHours,
            address: settings.address,
            mapsUrl: settings.mapsUrl,
            latitude: settings.latitude,
            longitude: settings.longitude,
            facebookPageId: settings.facebookPageId,
            instagramUrl: settings.instagramUrl,
            aboutMission: settings.aboutMission,
            aboutPillars: settings.aboutPillars,
            quotaAmount: settings.quotaAmount,
            mbwayNumber: settings.mbwayNumber,
            iban: settings.iban,
            multibancoEntity: settings.multibancoEntity,
            multibancoReference: settings.multibancoReference,
            showChatbotBubble: settings.showChatbotBubble,
            ttsModel: settings.ttsModel,
            aiProvider: settings.aiProvider,
        };
    },
});

export const getAdmin = query({
    args: {},
    handler: async (ctx) => {
        // Null for non-admins (instead of throwing) so the reactive client can
        // subscribe unconditionally and overlay when the role allows it
        if (!(await isAdmin(ctx).catch(() => false))) return null;
        const doc = await ctx.db.query("settings").first();
        if (!doc) return null;
        // Secrets are write-only: replaced with a presence flag so the admin
        // UI can show "configured" without ever echoing the value
        const { facebookAccessToken, openrouterApiKey, customApiKey, ...safeDoc } = doc;
        return {
            ...safeDoc,
            hasFacebookAccessToken: Boolean(facebookAccessToken),
            hasOpenrouterApiKey: Boolean(openrouterApiKey),
            hasCustomApiKey: Boolean(customApiKey),
        };
    },
});

export const getForAI = internalQuery({
    args: {},
    handler: async (ctx) => {
        const doc = await ctx.db.query("settings").first();
        if (!doc) return null;
        return {
            siteName: doc.siteName,
            siteFullName: doc.siteFullName,
            locality: doc.locality,
            address: doc.address,
            chatModel: doc.chatModel,
            chatModelFallback: doc.chatModelFallback,
            aiGuardrailsEnabled: doc.aiGuardrailsEnabled,
            aiSystemPromptExtra: doc.aiSystemPromptExtra,
            aiAllowedTopics: doc.aiAllowedTopics,
            aiForbiddenTopics: doc.aiForbiddenTopics,
            thinkingBudget: doc.thinkingBudget,
            ttsModel: doc.ttsModel,
            imageModel: doc.imageModel,
            contentTone: doc.contentTone,
            aiProvider: doc.aiProvider,
            openrouterApiKey: doc.openrouterApiKey,
            openrouterModel: doc.openrouterModel,
            customApiUrl: doc.customApiUrl,
            customApiKey: doc.customApiKey,
            customModel: doc.customModel,
        };
    },
});

export const update = mutation({
    args: {
        siteName: v.optional(v.string()),
        maintenanceMode: v.optional(v.boolean()),
        contactEmail: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        currentMandate: v.optional(v.string()),
        siteFullName: v.optional(v.string()),
        locality: v.optional(v.string()),
        region: v.optional(v.string()),
        foundedYear: v.optional(v.string()),
        heroTagline: v.optional(v.string()),
        heroSubtitle: v.optional(v.string()),
        historyIntro: v.optional(v.string()),
        historyQuote: v.optional(v.string()),
        venueName: v.optional(v.string()),
        venueDescription: v.optional(v.string()),
        foundersNote: v.optional(v.string()),
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
        openingHours: v.optional(v.string()),
        address: v.optional(v.string()),
        mapsUrl: v.optional(v.string()),
        latitude: v.optional(v.string()),
        longitude: v.optional(v.string()),
        facebookPageId: v.optional(v.string()),
        instagramUrl: v.optional(v.string()),
        quotaAmount: v.optional(v.string()),
        mbwayNumber: v.optional(v.string()),
        iban: v.optional(v.string()),
        multibancoEntity: v.optional(v.string()),
        multibancoReference: v.optional(v.string()),
        aboutMission: v.optional(v.string()),
        aboutPillars: v.optional(v.array(v.object({
            icon: v.string(),
            title: v.string(),
            description: v.string(),
        }))),
        facebookAccessToken: v.optional(v.string()),
        showChatbotBubble: v.optional(v.boolean()),
        ttsModel: v.optional(v.string()),
        aiProvider: v.optional(v.string()),
        openrouterApiKey: v.optional(v.string()),
        openrouterModel: v.optional(v.string()),
        customApiUrl: v.optional(v.string()),
        customApiKey: v.optional(v.string()),
        customModel: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        if (args.aiProvider !== undefined && !["gemini", "openrouter", "custom"].includes(args.aiProvider)) {
            throw new Error("aiProvider inválido: usa gemini, openrouter ou custom.");
        }
        if (args.openrouterApiKey !== undefined) validateMaxLength(args.openrouterApiKey, "openrouterApiKey", 500);
        if (args.openrouterModel !== undefined) validateMaxLength(args.openrouterModel, "openrouterModel", 100);
        if (args.customApiUrl !== undefined) validateMaxLength(args.customApiUrl, "customApiUrl", 500);
        if (args.customApiKey !== undefined) validateMaxLength(args.customApiKey, "customApiKey", 500);
        if (args.customModel !== undefined) validateMaxLength(args.customModel, "customModel", 100);
        if (args.siteName !== undefined) validateMaxLength(args.siteName, "siteName", 200);
        if (args.contactEmail !== undefined) validateMaxLength(args.contactEmail, "contactEmail", 254);
        if (args.logoUrl !== undefined) validateMaxLength(args.logoUrl, "logoUrl", 500);
        if (args.currentMandate !== undefined) validateMaxLength(args.currentMandate, "currentMandate", 100);
        if (args.siteFullName !== undefined) validateMaxLength(args.siteFullName, "siteFullName", 600);
        if (args.locality !== undefined) validateMaxLength(args.locality, "locality", 600);
        if (args.region !== undefined) validateMaxLength(args.region, "region", 600);
        if (args.foundedYear !== undefined) validateMaxLength(args.foundedYear, "foundedYear", 600);
        if (args.heroTagline !== undefined) validateMaxLength(args.heroTagline, "heroTagline", 600);
        if (args.heroSubtitle !== undefined) validateMaxLength(args.heroSubtitle, "heroSubtitle", 600);
        if (args.historyIntro !== undefined) validateMaxLength(args.historyIntro, "historyIntro", 4000);
        if (args.historyQuote !== undefined) validateMaxLength(args.historyQuote, "historyQuote", 600);
        if (args.venueName !== undefined) validateMaxLength(args.venueName, "venueName", 600);
        if (args.venueDescription !== undefined) validateMaxLength(args.venueDescription, "venueDescription", 600);
        if (args.foundersNote !== undefined) validateMaxLength(args.foundersNote, "foundersNote", 600);
        if (args.contentTone !== undefined) validateMaxLength(args.contentTone, "contentTone", 100);
        if (args.defaultImageStyle !== undefined) validateMaxLength(args.defaultImageStyle, "defaultImageStyle", 500);
        if (args.chatModel !== undefined) validateMaxLength(args.chatModel, "chatModel", 50);
        if (args.chatModelFallback !== undefined) validateMaxLength(args.chatModelFallback, "chatModelFallback", 50);
        if (args.imageModel !== undefined) validateMaxLength(args.imageModel, "imageModel", 50);
        if (args.aiSystemPromptExtra !== undefined) validateMaxLength(args.aiSystemPromptExtra, "aiSystemPromptExtra", 500);
        if (args.aiAllowedTopics !== undefined) validateMaxLength(args.aiAllowedTopics, "aiAllowedTopics", 200);
        if (args.aiForbiddenTopics !== undefined) validateMaxLength(args.aiForbiddenTopics, "aiForbiddenTopics", 200);
        if (args.imageResolution !== undefined) validateMaxLength(args.imageResolution, "imageResolution", 50);
        if (args.phone !== undefined) validateMaxLength(args.phone, "phone", 50);
        if (args.openingHours !== undefined) validateMaxLength(args.openingHours, "openingHours", 200);
        if (args.instagramUrl !== undefined) validateMaxLength(args.instagramUrl, "instagramUrl", 300);
        if (args.address !== undefined) validateMaxLength(args.address, "address", 300);
        if (args.mapsUrl !== undefined) validateMaxLength(args.mapsUrl, "mapsUrl", 500);
        if (args.latitude !== undefined) validateMaxLength(args.latitude, "latitude", 20);
        if (args.longitude !== undefined) validateMaxLength(args.longitude, "longitude", 20);
        if (args.facebookPageId !== undefined) validateMaxLength(args.facebookPageId, "facebookPageId", 100);
        if (args.facebookAccessToken !== undefined) validateMaxLength(args.facebookAccessToken, "facebookAccessToken", 500);
        if (args.quotaAmount !== undefined) validateMaxLength(args.quotaAmount, "quotaAmount", 50);
        if (args.mbwayNumber !== undefined) validateMaxLength(args.mbwayNumber, "mbwayNumber", 30);
        if (args.iban !== undefined) validateMaxLength(args.iban, "iban", 40);
        if (args.multibancoEntity !== undefined) validateMaxLength(args.multibancoEntity, "multibancoEntity", 10);
        if (args.multibancoReference !== undefined) validateMaxLength(args.multibancoReference, "multibancoReference", 15);
        if (args.aboutMission !== undefined) validateMaxLength(args.aboutMission, "aboutMission", 1000);
        if (args.aboutPillars !== undefined) {
            if (args.aboutPillars.length > 6) throw new Error("aboutPillars: máximo de 6 pilares.");
            for (const pillar of args.aboutPillars) {
                validateMaxLength(pillar.icon, "aboutPillars.icon", 50);
                validateMaxLength(pillar.title, "aboutPillars.title", 100);
                validateMaxLength(pillar.description, "aboutPillars.description", 500);
            }
        }
        if (args.ttsModel !== undefined) validateMaxLength(args.ttsModel, "ttsModel", 50);
        const existing = await ctx.db.query("settings").first();
        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("settings", {
                siteName: args.siteName ?? "Associação",
                maintenanceMode: args.maintenanceMode ?? false,
                contactEmail: args.contactEmail,
                logoUrl: args.logoUrl,
                currentMandate: args.currentMandate,
                siteFullName: args.siteFullName,
                locality: args.locality,
                region: args.region,
                foundedYear: args.foundedYear,
                heroTagline: args.heroTagline,
                heroSubtitle: args.heroSubtitle,
                historyIntro: args.historyIntro,
                historyQuote: args.historyQuote,
                venueName: args.venueName,
                venueDescription: args.venueDescription,
                foundersNote: args.foundersNote,
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
                openingHours: args.openingHours,
                address: args.address,
                mapsUrl: args.mapsUrl,
                latitude: args.latitude,
                longitude: args.longitude,
                facebookPageId: args.facebookPageId,
                instagramUrl: args.instagramUrl,
                aboutMission: args.aboutMission,
                aboutPillars: args.aboutPillars,
                quotaAmount: args.quotaAmount,
                mbwayNumber: args.mbwayNumber,
                iban: args.iban,
                multibancoEntity: args.multibancoEntity,
                multibancoReference: args.multibancoReference,
                facebookAccessToken: args.facebookAccessToken,
                showChatbotBubble: args.showChatbotBubble,
                ttsModel: args.ttsModel,
                aiProvider: args.aiProvider,
                openrouterApiKey: args.openrouterApiKey,
                openrouterModel: args.openrouterModel,
                customApiUrl: args.customApiUrl,
                customApiKey: args.customApiKey,
                customModel: args.customModel,
            });
        }
    },
});
