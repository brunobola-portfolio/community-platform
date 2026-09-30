import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { sweepAbandonedUploads as sweepUploads } from "./lib/uploads";

/**
 * Retention jobs run by convex/crons.ts. Each one deletes a bounded batch and
 * schedules itself again while batches come back full, so a backlog drains
 * without one mutation growing past Convex's per-transaction limits.
 */

const BATCH = 1000;
const DAY_MS = 24 * 3600 * 1000;
const LOG_RETENTION_DAYS = 90;

export const cleanupRateLimits = internalMutation({
    args: {},
    handler: async (ctx) => {
        const oneHourAgo = Date.now() - 3600000;
        const staleEntries = await ctx.db
            .query("rateLimits")
            .withIndex("by_lastRefill", (q) => q.lt("lastRefill", oneHourAgo))
            .take(BATCH);

        for (const entry of staleEntries) await ctx.db.delete(entry._id);

        if (staleEntries.length > 0) {
            console.log(`Cleaned up ${staleEntries.length} stale rate limit entries.`);
        }
        if (staleEntries.length === BATCH) await ctx.scheduler.runAfter(0, internal.maintenance.cleanupRateLimits, {});
    },
});

export const cleanupOldLogs = internalMutation({
    args: {},
    handler: async (ctx) => {
        const cutoff = Date.now() - LOG_RETENTION_DAYS * DAY_MS;
        const oldLogs = await ctx.db
            .query("activityLogs")
            .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
            .take(BATCH);

        for (const log of oldLogs) await ctx.db.delete(log._id);

        if (oldLogs.length > 0) {
            console.log(`Cleaned up ${oldLogs.length} old activity log entries.`);
        }
        if (oldLogs.length === BATCH) await ctx.scheduler.runAfter(0, internal.maintenance.cleanupOldLogs, {});
    },
});

// AI usage rows carry a user id and the failure text, so they are not kept indefinitely
export const cleanupOldAiUsageLogs = internalMutation({
    args: {},
    handler: async (ctx) => {
        const cutoff = Date.now() - LOG_RETENTION_DAYS * DAY_MS;
        const old = await ctx.db
            .query("aiUsageLogs")
            .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
            .take(BATCH);

        for (const row of old) await ctx.db.delete(row._id);

        if (old.length > 0) console.log(`Cleaned up ${old.length} old AI usage log entries.`);
        if (old.length === BATCH) await ctx.scheduler.runAfter(0, internal.maintenance.cleanupOldAiUsageLogs, {});
    },
});

const UPLOAD_SWEEP_BATCH = 200;

// Uploads nobody saved into a record within the grace period (convex/lib/uploads.ts)
export const sweepAbandonedUploads = internalMutation({
    args: {},
    handler: async (ctx) => {
        const removed = await sweepUploads(ctx, Date.now(), UPLOAD_SWEEP_BATCH);
        if (removed > 0) console.log(`Removed ${removed} abandoned uploads.`);
        if (removed === UPLOAD_SWEEP_BATCH) await ctx.scheduler.runAfter(0, internal.maintenance.sweepAbandonedUploads, {});
    },
});
