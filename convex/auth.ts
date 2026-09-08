import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";

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
                return { email: params.email as string, ...(name ? { name } : {}) };
            },
        }),
    ],
});
