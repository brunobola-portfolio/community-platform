import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

/**
 * Extended user type with optional role field.
 * The role field is declared in the schema (users table override) and set by patch.
 */
export interface UserWithRole {
  role?: string;
  email?: string;
  name?: string;
}

/**
 * Get the current authenticated user, or null if not logged in.
 * Use in queries that optionally personalize content.
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

/**
 * Require authentication. Throws if not logged in.
 * Use in mutations that require any authenticated user.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<{ userId: string; user: Doc<"users"> }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Autenticação necessária. Faz login para continuar.");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError("Utilizador não encontrado.");
  }
  return { userId: userId as string, user };
}

/**
 * Check if the current user is an admin without throwing.
 * Returns true if admin, false otherwise. Use in queries that
 * need to return [] for non-admins instead of throwing.
 */
export async function isAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  if (!user) return false;
  const userWithRole = user as unknown as UserWithRole;
  return userWithRole.role === "admin";
}

/**
 * Require admin role. Throws if not logged in or not admin.
 * Use in ALL CMS/admin mutations.
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<{ userId: string; user: Doc<"users"> }> {
  const { userId, user } = await requireAuth(ctx);
  // The user document may have a 'role' field added via patch
  const userWithRole = user as unknown as UserWithRole;
  if (userWithRole.role !== "admin") {
    throw new ConvexError("Acesso negado. Permissões de administrador necessárias.");
  }
  return { userId, user };
}
