/**
 * First-run setup module.
 *
 * Powers the self-service admin bootstrap wizard shown the first time the
 * portal is opened after a fresh deploy. Once a single admin exists, the
 * wizard is permanently disabled (any further bootstrap attempts throw).
 *
 * Threat model: a public mutation that promotes the calling user to admin
 * is only safe when guarded by an idempotent "no admin yet" check. Convex
 * serializes mutations, so concurrent calls cannot both succeed.
 */

import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { UserWithRole } from "./lib/auth";

/**
 * Public probe used by the routing gate. Returns true when at least one
 * admin user exists. Reactive and public, so it reads one indexed row
 * instead of the whole users table.
 */
export const isSetupComplete = query({
    args: {},
    handler: async (ctx) => {
        const admin = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).first();
        return admin !== null;
    },
});

/**
 * Promotes the currently authenticated user to admin, but only when no
 * admin exists yet. Idempotent and race-safe via Convex transactional
 * mutation semantics.
 *
 * Frontend flow:
 *   1) signIn("password", { email, password, flow: "signUp" })
 *   2) bootstrapInitialAdmin({})
 *
 * Step 2 must run while the user from step 1 is still authenticated.
 */
export const bootstrapInitialAdmin = mutation({
    args: {},
    handler: async (ctx) => {
        const existingAdmin = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).first();
        if (existingAdmin) {
            // ConvexError: plain Error messages are redacted to "Server Error"
            // on production deployments; only ConvexError data reaches clients.
            throw new ConvexError(
                "O sistema já tem um administrador configurado. Para reset, contacta o administrador atual ou apaga manualmente via Convex Dashboard.",
            );
        }

        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new ConvexError("Sessão expirada. Volta a iniciar o setup.");
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            throw new ConvexError("Conta de utilizador não encontrada.");
        }

        await ctx.db.patch(userId, { role: "admin" });

        return {
            success: true,
            email: (user as unknown as UserWithRole).email ?? null,
        };
    },
});
