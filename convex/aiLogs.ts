import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const log = internalMutation({
  args: {
    userId: v.string(),
    action: v.string(),
    model: v.string(),
    classification: v.optional(v.string()),
    latencyMs: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiUsageLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const days = args.days ?? 7;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const logs = await ctx.db
      .query("aiUsageLogs")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", since))
      .take(10000);

    // Aggregate stats
    const totalCalls = logs.length;
    const successCount = logs.filter((l) => l.success).length;
    const errorCount = totalCalls - successCount;
    const avgLatency =
      totalCalls > 0
        ? Math.round(
            logs.reduce((s, l) => s + l.latencyMs, 0) / totalCalls
          )
        : 0;

    // By action breakdown
    const byAction: Record<string, number> = {};
    for (const l of logs) {
      byAction[l.action] = (byAction[l.action] || 0) + 1;
    }

    // By model breakdown
    const byModel: Record<string, number> = {};
    for (const l of logs) {
      byModel[l.model] = (byModel[l.model] || 0) + 1;
    }

    // By classification (for guardrail effectiveness)
    const byClassification: Record<string, number> = {};
    for (const l of logs) {
      if (l.classification) {
        byClassification[l.classification] =
          (byClassification[l.classification] || 0) + 1;
      }
    }

    // Daily breakdown (for chart)
    const daily: Record<string, number> = {};
    for (const l of logs) {
      const day = new Date(l.timestamp).toISOString().slice(0, 10);
      daily[day] = (daily[day] || 0) + 1;
    }

    return {
      totalCalls,
      successCount,
      errorCount,
      successRate:
        totalCalls > 0
          ? Math.round((successCount / totalCalls) * 100)
          : 100,
      avgLatency,
      byAction,
      byModel,
      byClassification,
      daily,
    };
  },
});
