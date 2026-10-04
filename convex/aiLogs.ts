import { internalMutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { isAdmin, requireAdmin } from "./lib/auth";
import { clampSince, failureReason, featureOf, summarizeUsage } from "./lib/aiUsageStats";

/** Enough for months of a community portal; past it the panel says the numbers are partial. */
const MAX_ROWS = 5000;
const RECENT_ROWS = 25;

export const log = internalMutation({
  args: {
    userId: v.string(),
    action: v.string(),
    model: v.string(),
    classification: v.optional(v.string()),
    latencyMs: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    costUsd: v.optional(v.number()),
    feature: v.optional(v.string()),
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

async function rowsSince(ctx: QueryCtx, since: number) {
  return ctx.db
    .query("aiUsageLogs")
    .withIndex("by_timestamp", (q) => q.gte("timestamp", clampSince(since, Date.now())))
    .order("desc")
    .take(MAX_ROWS);
}

/** "quem" for the latest requests: the account email, or a plain label for visitors. */
async function whoIs(ctx: QueryCtx, userId: string): Promise<string> {
  if (userId === "anonymous") return "Visitante";
  const id = ctx.db.normalizeId("users", userId);
  const user = id ? await ctx.db.get(id) : null;
  return user?.email ?? user?.name ?? "Desconhecido";
}

/**
 * Everything the "Utilização e custos" panel shows for a period. The browser
 * sends the start of the period in its own calendar (and its UTC offset for
 * the daily buckets), so "este mês" means the admin's month.
 */
export const usage = query({
  args: { since: v.number(), tzOffsetMinutes: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const rows = await rowsSince(ctx, args.since);
    const summary = summarizeUsage(rows, { since: clampSince(args.since, now), until: now, tzOffsetMinutes: args.tzOffsetMinutes });
    const recent = await Promise.all(rows.slice(0, RECENT_ROWS).map(async (row) => ({
      id: row._id,
      timestamp: row.timestamp,
      who: await whoIs(ctx, row.userId),
      feature: featureOf(row),
      model: row.model,
      latencyMs: row.latencyMs,
      costUsd: row.costUsd,
      success: row.success,
      reason: row.success ? undefined : failureReason(row.errorMessage),
    })));
    const settings = await ctx.db.query("settings").first();
    return { ...summary, recent, truncated: rows.length === MAX_ROWS, budgetUsd: settings?.aiMonthlyBudgetUsd };
  },
});

/**
 * This month's spend for the dashboard tile and the budget warning in the
 * studio and the MediaStudio. Null for non-admins, so it can be subscribed to
 * unconditionally.
 */
export const monthSummary = query({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx).catch(() => false))) return null;
    const rows = await rowsSince(ctx, args.since);
    const costUsd = rows.reduce((s, r) => s + (r.costUsd ?? 0), 0);
    const settings = await ctx.db.query("settings").first();
    const budgetUsd = settings?.aiMonthlyBudgetUsd;
    return { costUsd, calls: rows.length, budgetUsd, overBudget: Boolean(budgetUsd && costUsd > budgetUsd) };
  },
});
