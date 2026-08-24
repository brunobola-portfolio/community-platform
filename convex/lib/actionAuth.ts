import { query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Query that checks if the current user is authenticated.
 * Used by actions (which can't directly access auth) via ctx.runQuery.
 */
export const checkAuth = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Autenticação necessária para esta ação.");
    }
    return userId;
  },
});

/**
 * Returns the current user id or null when the request is anonymous.
 * Used by public-facing actions (chat, tts, geoQuery) that must work for
 * unauthenticated visitors while still being able to attribute rate-limit
 * buckets and analytics to logged-in users when available.
 */
export const getOptionalAuth = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId ?? null;
  },
});

/**
 * Query that checks if the current user is an authenticated admin.
 * Used by admin-only actions (generateImage, enhanceText) via ctx.runQuery.
 * Actions cannot access auth directly, so this bridges the gap.
 */
export const checkAdminAuth = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Autenticação necessária.");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Autenticação necessária.");
    }
    const userWithRole = user as unknown as { role?: string };
    if (userWithRole.role !== "admin") {
      throw new Error("Acesso negado. Permissões de administrador necessárias.");
    }
    return userId;
  },
});
