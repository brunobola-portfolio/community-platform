import { internalMutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { consume, openBucket, type BucketConfig } from "./tokenBucket";

/**
 * Rate limit configuration per AI action.
 */
const RATE_LIMITS: Record<string, BucketConfig> = {
  "ai:chat": { maxTokens: 10, refillPerMinute: 10 },
  "ai:tts": { maxTokens: 5, refillPerMinute: 5 },
  "ai:geoQuery": { maxTokens: 10, refillPerMinute: 10 },
  // Global ceilings for anonymous traffic, on top of the per-session buckets
  "ai:chat:anonymous": { maxTokens: 120, refillPerMinute: 60 },
  "ai:tts:anonymous": { maxTokens: 30, refillPerMinute: 15 },
  "ai:geoQuery:anonymous": { maxTokens: 60, refillPerMinute: 30 },
  "ai:generateImage": { maxTokens: 3, refillPerMinute: 3 },
  "ai:enhanceText": { maxTokens: 10, refillPerMinute: 10 },
  "content:create": { maxTokens: 20, refillPerMinute: 10 },
  "content:update": { maxTokens: 30, refillPerMinute: 15 },
  "registration:create": { maxTokens: 5, refillPerMinute: 5 },
  // Public forms: tighter buckets keyed per submitted email
  "contact:create": { maxTokens: 3, refillPerMinute: 1 },
  "sponsorship:create": { maxTokens: 3, refillPerMinute: 1 },
  // Global caps so rotating the submitted email does not mint fresh buckets
  "contact:create:global": { maxTokens: 30, refillPerMinute: 10 },
  "sponsorship:create:global": { maxTokens: 20, refillPerMinute: 5 },
};

/**
 * Internal mutation to check and consume a rate limit token.
 * Returns normally if allowed, throws if rate limited. The arithmetic lives in
 * lib/tokenBucket.ts; this function only reads and writes the row.
 */
export const checkAndConsume = internalMutation({
  args: { key: v.string(), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const config = RATE_LIMITS[args.key];
    if (!config) return; // No limit configured

    const storageKey = args.userId ? `${args.key}:${args.userId}` : args.key;
    const now = Date.now();

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", storageKey))
      .first();

    if (!existing) {
      await ctx.db.insert("rateLimits", { key: storageKey, ...openBucket(config, now) });
      return;
    }

    const decision = consume(existing, config, now);
    if (!decision.allowed) {
      // The throw rolls the transaction back, so a rejected request leaves the
      // clock where it was and the caller earns tokens by waiting, not by retrying
      throw new ConvexError("Limite de pedidos atingido. Aguarde um momento antes de tentar novamente.");
    }
    await ctx.db.patch(existing._id, decision.state);
  },
});
