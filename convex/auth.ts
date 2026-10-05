import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import type { MutationCtx } from "./_generated/server";

/** Admin and member accounts share this provider, so the floor is not 8 chars. */
function validatePasswordRequirements(password: string) {
    if (password.length < 10) throw new ConvexError("A palavra-passe precisa de pelo menos 10 caracteres.");
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        throw new ConvexError("A palavra-passe precisa de maiúsculas, minúsculas e um número.");
    }
}

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [
        Password({
            validatePasswordRequirements,
            // The member card and the greeting use `name`; without it the UI falls back to the email prefix
            profile(params) {
                const name = typeof params.name === "string" ? params.name.trim().slice(0, 80) : "";
                // One account per address whatever the capitalisation; access.grant stores it the same way
                const email = String(params.email ?? "").trim().toLowerCase();
                return { email, ...(name ? { name } : {}) };
            },
        }),
    ],
    callbacks: {
        /**
         * Accounts are given by an administrator (Acessos tab, access.grant), which always sets
         * a role. A sign-up without one is only accepted while no administrator exists, so the
         * first-run /setup wizard works and nobody else can mint an account through the API.
         * Throwing here aborts the transaction, so the user is never stored.
         */
        async afterUserCreatedOrUpdated(ctx, { existingUserId, profile }) {
            if (existingUserId !== null || typeof profile.role === "string") return;
            // The library types ctx generically; this deployment's schema has the by_role index
            const db = (ctx as unknown as MutationCtx).db;
            const admin = await db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).first();
            if (admin) {
                throw new ConvexError("As contas são criadas pela direção. Peça acesso a um administrador do site.");
            }
        },
    },
});
