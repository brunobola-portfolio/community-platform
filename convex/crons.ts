import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up stale rate limit entries (older than 1 hour) - every hour
crons.interval("cleanup:rateLimits", { hours: 1 }, internal.maintenance.cleanupRateLimits);

// Clean up old activity logs (older than 90 days) - daily at 3 AM UTC
crons.daily("cleanup:activityLogs", { hourUTC: 3, minuteUTC: 0 }, internal.maintenance.cleanupOldLogs);

export default crons;
