/**
 * Internal helpers for purging stale auth state left over from
 * development testing. Safe to keep in production: both mutations are
 * `internalMutation`s and only callable via the Convex CLI/Dashboard.
 *
 * Use cases:
 *   - Wipe leftover throwaway users before going live with the real admin
 *   - Remove a specific account when forgotten password locks the system
 *
 * CLI invocation:
 *   npx convex run lib/cleanupTestUsers:purgeUserByEmail '{"email":"x@y.com"}'
 *   npx convex run lib/cleanupTestUsers:purgeAllUsers '{"confirm":"YES"}'
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

// Auth-related tables that hold per-user rows and must be cleaned alongside users
const AUTH_TABLES = [
    "authAccounts",
    "authRefreshTokens",
    "authSessions",
    "authVerificationCodes",
    "authVerifiers",
] as const;

async function cascadeDeleteUser(
    ctx: { db: { query: (t: string) => any; delete: (id: Id<any>) => Promise<void> } },
    userId: Id<"users">,
) {
    for (const table of AUTH_TABLES) {
        const rows = await ctx.db.query(table).collect();
        for (const row of rows) {
            if ((row as { userId?: string }).userId === userId) {
                await ctx.db.delete(row._id);
            }
        }
    }
    await ctx.db.delete(userId);
}

/** Delete a single user (and all their auth rows) by email. */
export const purgeUserByEmail = internalMutation({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        const users = await ctx.db.query("users").collect();
        const user = users.find((u) => (u as { email?: string }).email === email);
        if (!user) {
            return { success: false, message: `Sem utilizador com email ${email}.` };
        }
        await cascadeDeleteUser(ctx as never, user._id);
        return { success: true, message: `Utilizador ${email} apagado.` };
    },
});

/**
 * Wipe every user + auth row in the database. Requires explicit confirmation
 * to prevent accidents. Intended for fresh-start before first production setup.
 */
export const purgeAllUsers = internalMutation({
    args: { confirm: v.string() },
    handler: async (ctx, { confirm }) => {
        if (confirm !== "YES") {
            throw new Error('Para confirmar, passa { "confirm": "YES" } como argumento.');
        }
        const users = await ctx.db.query("users").collect();
        for (const u of users) {
            await cascadeDeleteUser(ctx as never, u._id);
        }
        for (const table of AUTH_TABLES) {
            const stragglers = await ctx.db.query(table).collect();
            for (const row of stragglers) {
                await ctx.db.delete(row._id);
            }
        }
        return { success: true, deleted: users.length };
    },
});
