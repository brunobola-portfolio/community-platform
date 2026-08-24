import { internalMutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";

/**
 * Rate limit configuration per AI action.
 */
const RATE_LIMITS: Record<string, { maxTokens: number; refillPerMinute: number }> = {
  "ai:chat": { maxTokens: 10, refillPerMinute: 10 },
  "ai:tts": { maxTokens: 5, refillPerMinute: 5 },
  "ai:geoQuery": { maxTokens: 10, refillPerMinute: 10 },
  "ai:generateImage": { maxTokens: 3, refillPerMinute: 3 },
  "ai:enhanceText": { maxTokens: 10, refillPerMinute: 10 },
  "content:create": { maxTokens: 20, refillPerMinute: 10 },
  "content:update": { maxTokens: 30, refillPerMinute: 15 },
  "registration:create": { maxTokens: 5, refillPerMinute: 5 },
  // Public forms: tighter buckets keyed per submitted email
  "contact:create": { maxTokens: 3, refillPerMinute: 1 },
  "sponsorship:create": { maxTokens: 3, refillPerMinute: 1 },
};

/**
 * Internal mutation to check and consume a rate limit token.
 * Returns true if allowed, throws if rate limited.
 */
export const checkAndConsume = internalMutation({
  args: { key: v.string(), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const config = RATE_LIMITS[args.key];
    if (!config) return; // No limit configured

    const storageKey = args.userId ? `${args.key}:${args.userId}` : args.key;
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", storageKey))
      .first();

    if (existing) {
      // Cleanup if entry is stale (> 1 hour old)
      if (now - existing.lastRefill > ONE_HOUR) {
        await ctx.db.patch(existing._id, {
          tokens: config.maxTokens - 1,
          lastRefill: now,
        });
        return;
      }
      // Refill tokens based on elapsed time
      const elapsed = (now - existing.lastRefill) / 60000; // minutes
      const refilled = Math.min(
        config.maxTokens,
        Math.floor(existing.tokens + elapsed * config.refillPerMinute)
      );

      if (refilled < 1) {
        throw new ConvexError("Limite de pedidos atingido. Aguarde um momento antes de tentar novamente.");
      }

      await ctx.db.patch(existing._id, {
        tokens: refilled - 1,
        lastRefill: now,
      });
    } else {
      // First request — create bucket with one token consumed
      await ctx.db.insert("rateLimits", {
        key: storageKey,
        tokens: config.maxTokens - 1,
        lastRefill: now,
      });
    }
  },
});
