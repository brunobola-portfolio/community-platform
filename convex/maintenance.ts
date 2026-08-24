import { mutation, internalMutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

/**
 * Maintenance mutations for database cleanup and integrity.
 * these are administrative functions to be run from the Convex Dashboard or CLI.
 */

// Repurposing cleanAll to be the smart deduplication function
// This avoids issues where new function names aren't picked up by the dev server
export const safeCleanup = mutation({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        const results: Record<string, number> = {};
        console.log("Starting safe duplicate cleanup (Smart Deduplication)...");

        // Per-table deduplication with explicit typed queries (no dynamic table names)

        // 1. Stats - unique by label
        {
            const docs = await ctx.db.query("stats").collect();
            const seen = new Set<string>();
            let removedCount = 0;
            for (const doc of docs) {
                const key = doc.label;
                if (key != null && seen.has(key)) { await ctx.db.delete(doc._id); removedCount++; }
                else if (key != null) { seen.add(key); }
            }
            results.stats = removedCount;
        }

        // 2. Action Areas - unique by title
        {
            const docs = await ctx.db.query("actionAreas").collect();
            const seen = new Set<string>();
            let removedCount = 0;
            for (const doc of docs) {
                const key = doc.title;
                if (key != null && seen.has(key)) { await ctx.db.delete(doc._id); removedCount++; }
                else if (key != null) { seen.add(key); }
            }
            results.actionAreas = removedCount;
        }

        // 3. Events - unique by slug
        {
            const docs = await ctx.db.query("events").collect();
            const seen = new Set<string>();
            let removedCount = 0;
            for (const doc of docs) {
                const key = doc.slug;
                if (key != null && seen.has(key)) { await ctx.db.delete(doc._id); removedCount++; }
                else if (key != null) { seen.add(key); }
            }
            results.events = removedCount;
        }

        // 4. Posts - unique by slug
        {
            const docs = await ctx.db.query("posts").collect();
            const seen = new Set<string>();
            let removedCount = 0;
            for (const doc of docs) {
                const key = doc.slug;
                if (key != null && seen.has(key)) { await ctx.db.delete(doc._id); removedCount++; }
                else if (key != null) { seen.add(key); }
            }
            results.posts = removedCount;
        }

        // 5. Sponsors - unique by name
        {
            const docs = await ctx.db.query("sponsors").collect();
            const seen = new Set<string>();
            let removedCount = 0;
            for (const doc of docs) {
                const key = doc.name;
                if (key != null && seen.has(key)) { await ctx.db.delete(doc._id); removedCount++; }
                else if (key != null) { seen.add(key); }
            }
            results.sponsors = removedCount;
        }

        // 6. Categories - unique by slug
        {
            const docs = await ctx.db.query("categories").collect();
            const seen = new Set<string>();
            let removedCount = 0;
            for (const doc of docs) {
                const key = doc.slug;
                if (key != null && seen.has(key)) { await ctx.db.delete(doc._id); removedCount++; }
                else if (key != null) { seen.add(key); }
            }
            results.categories = removedCount;
        }

        // 7. Sponsor Tiers - unique by name
        {
            const docs = await ctx.db.query("sponsorTiers").collect();
            const seen = new Set<string>();
            let removedCount = 0;
            for (const doc of docs) {
                const key = doc.name;
                if (key != null && seen.has(key)) { await ctx.db.delete(doc._id); removedCount++; }
                else if (key != null) { seen.add(key); }
            }
            results.sponsorTiers = removedCount;
        }

        // 8. Members - unique by name + group (composite key)
        const members = await ctx.db.query("members").collect();
        const seenMembers = new Set<string>();
        let membersRemoved = 0;
        for (const member of members) {
            const key = `${member.name}::${member.group}`;
            if (seenMembers.has(key)) {
                await ctx.db.delete(member._id);
                membersRemoved++;
            } else {
                seenMembers.add(key);
            }
        }
        results.members = membersRemoved;

        console.log("Cleanup results:", results);
        return results;
    },
});

export const cleanupRateLimits = internalMutation({
    args: {},
    handler: async (ctx) => {
        const oneHourAgo = Date.now() - 3600000;
        const staleEntries = await ctx.db
            .query("rateLimits")
            .collect();

        let cleaned = 0;
        for (const entry of staleEntries) {
            if (entry.lastRefill < oneHourAgo) {
                await ctx.db.delete(entry._id);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} stale rate limit entries.`);
        }
    },
});

export const cleanupOldLogs = internalMutation({
    args: {},
    handler: async (ctx) => {
        const ninetyDaysAgo = Date.now() - 90 * 24 * 3600000;
        const oldLogs = await ctx.db
            .query("activityLogs")
            .withIndex("by_timestamp")
            .collect();

        let cleaned = 0;
        for (const log of oldLogs) {
            if (log.timestamp < ninetyDaysAgo) {
                await ctx.db.delete(log._id);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} old activity log entries.`);
        }
    },
});
