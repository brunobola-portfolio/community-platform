import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up stale rate limit entries (older than 1 hour) - every hour
crons.interval("cleanup:rateLimits", { hours: 1 }, internal.maintenance.cleanupRateLimits);

// Clean up old activity logs (older than 90 days) - daily at 3 AM UTC
crons.daily("cleanup:activityLogs", { hourUTC: 3, minuteUTC: 0 }, internal.maintenance.cleanupOldLogs);

// AI usage analytics kept for 90 days - daily at 3:15 AM UTC
crons.daily("cleanup:aiUsageLogs", { hourUTC: 3, minuteUTC: 15 }, internal.maintenance.cleanupOldAiUsageLogs);

// Retention of registrations without an account (registrations.purgeExpiredGuests)
crons.daily("cleanup:guestRegistrations", { hourUTC: 3, minuteUTC: 30 }, internal.registrations.purgeExpiredGuests, {});

// Files uploaded from the MediaStudio but never saved into a record
crons.daily("cleanup:abandonedUploads", { hourUTC: 4, minuteUTC: 0 }, internal.maintenance.sweepAbandonedUploads);

export default crons;
