import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { UserWithRole } from "./auth";

// Run from Convex Dashboard to promote a user to admin:
// npx convex run lib/bootstrapAdmin:setUserRole '{"email": "admin@arcva.pt", "role": "admin"}'
export const setUserRole = internalMutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, { email, role }) => {
    // Find user by email
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => (u as unknown as UserWithRole).email === email);
    if (!user) {
      throw new Error(`Utilizador com email ${email} não encontrado.`);
    }
    await ctx.db.patch(user._id, { role } as Record<string, unknown>);
    return { success: true, message: `Utilizador ${email} agora tem role: ${role}` };
  },
});
