import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAdmin, isAdmin, getCurrentUser } from "./lib/auth";
import { validateMaxLength, validateEmail } from "./lib/validation";

// Quota profile of the signed-in user, matched by account email.
// Null when unauthenticated or when the direção has not registered the
// sócio yet — the member area renders a "contacta a direção" state.
export const mine = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user?.email) return null;
        const email = user.email.toLowerCase();
        const profile = await ctx.db
            .query("memberProfiles")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();
        if (!profile) return null;
        return {
            memberNumber: profile.memberNumber ?? null,
            quotaPaidUntil: profile.quotaPaidUntil ?? null,
        };
    },
});

// Null (not throw) for non-admins so the reactive client can subscribe
// unconditionally, mirroring events.listAll/posts.listAll
export const list = query({
    args: {},
    handler: async (ctx) => {
        if (!(await isAdmin(ctx).catch(() => false))) return null;
        const profiles = await ctx.db.query("memberProfiles").collect();
        return profiles.map((p) => ({
            id: p._id,
            email: p.email,
            memberNumber: p.memberNumber ?? "",
            quotaPaidUntil: p.quotaPaidUntil ?? "",
            notes: p.notes ?? "",
        }));
    },
});

export const upsert = mutation({
    args: {
        email: v.string(),
        memberNumber: v.optional(v.string()),
        quotaPaidUntil: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const email = args.email.trim().toLowerCase();
        if (!validateEmail(email)) {
            throw new ConvexError("Email inválido.");
        }
        validateMaxLength(email, "email", 254);
        if (args.memberNumber !== undefined) validateMaxLength(args.memberNumber, "memberNumber", 20);
        if (args.quotaPaidUntil !== undefined) {
            validateMaxLength(args.quotaPaidUntil, "quotaPaidUntil", 10);
            if (args.quotaPaidUntil && !/^\d{4}$/.test(args.quotaPaidUntil)) {
                throw new ConvexError("Quota paga até: usa o ano com 4 dígitos, ex. 2026.");
            }
        }
        if (args.notes !== undefined) validateMaxLength(args.notes, "notes", 500);

        const existing = await ctx.db
            .query("memberProfiles")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                memberNumber: args.memberNumber,
                quotaPaidUntil: args.quotaPaidUntil,
                notes: args.notes,
            });
            return existing._id;
        }
        return await ctx.db.insert("memberProfiles", {
            email,
            memberNumber: args.memberNumber,
            quotaPaidUntil: args.quotaPaidUntil,
            notes: args.notes,
        });
    },
});

export const remove = mutation({
    args: { id: v.id("memberProfiles") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) {
            throw new ConvexError("Registo de sócio não encontrado.");
        }
        await ctx.db.delete(args.id);
    },
});
