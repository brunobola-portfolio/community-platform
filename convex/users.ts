import { query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

// Public "who am I" query for personalizing the member area.
// Returns null when unauthenticated so callers can render guest state.
export const me = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;
        return {
            name: user.name ?? null,
            email: user.email ?? null,
            role: user.role ?? "user",
            createdAt: user._creationTime,
        };
    },
});
