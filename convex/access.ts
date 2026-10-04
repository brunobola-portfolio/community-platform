/**
 * Backoffice access management: who can sign in, and who runs the site.
 *
 * There is no email service, so an admin creates the account with a
 * temporary password shown once, and passes it on; the person changes it
 * after the first sign-in (changeOwnPassword). Resetting a forgotten password
 * works the same way and signs the person out everywhere.
 */
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import {
    createAccount,
    getAuthSessionId,
    getAuthUserId,
    invalidateSessions,
    modifyAccountCredentials,
    retrieveAccount,
} from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx, MutationCtx } from "./_generated/server";
import { isAdmin, requireAdmin } from "./lib/auth";
import { validateEmail, validateMaxLength } from "./lib/validation";
import { normalizeEmail, passwordProblem, roleChangeProblem, temporaryPassword } from "./lib/accessRules";

const role = v.union(v.literal("admin"), v.literal("user"));

export const list = query({
    args: {},
    handler: async (ctx) => {
        if (!(await isAdmin(ctx))) return [];
        const selfId = await getAuthUserId(ctx);
        const users = await ctx.db.query("users").take(1000);
        return users
            .map((u) => ({
                id: u._id,
                email: u.email ?? "",
                name: u.name ?? "",
                role: u.role ?? "user",
                createdAt: u._creationTime,
                isSelf: u._id === selfId,
            }))
            .sort((a, b) => (a.role === b.role ? b.createdAt - a.createdAt : a.role === "admin" ? -1 : 1));
    },
});

// ── Internal helpers for the actions (actions cannot read the database) ──────

export const actor = internalQuery({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;
        const user = await ctx.db.get(userId);
        return user ? { id: user._id, email: user.email ?? "", role: user.role ?? "user" } : null;
    },
});

export const findByEmail = internalQuery({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        const user = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
        return user ? { id: user._id, role: user.role ?? "user", name: user.name ?? "" } : null;
    },
});

export const userEmail = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => (await ctx.db.get(userId))?.email ?? null,
});

async function adminCount(ctx: MutationCtx): Promise<number> {
    return (await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).take(50)).length;
}

async function applyRoleChange(ctx: MutationCtx, actorId: Id<"users">, targetId: Id<"users">, nextRole: "admin" | "user") {
    const target = await ctx.db.get(targetId);
    if (!target) throw new ConvexError("Esta conta já não existe.");
    const problem = roleChangeProblem({
        actorId, targetId, targetRole: target.role, nextRole, adminCount: await adminCount(ctx),
    });
    if (problem) throw new ConvexError(problem);
    await ctx.db.patch(targetId, { role: nextRole });
}

export const setRoleInternal = internalMutation({
    args: { actorId: v.id("users"), targetId: v.id("users"), role },
    handler: async (ctx, args) => applyRoleChange(ctx, args.actorId, args.targetId, args.role),
});

async function requireAdminActor(ctx: ActionCtx) {
    const me = await ctx.runQuery(internal.access.actor, {});
    if (!me || me.role !== "admin") throw new ConvexError("Acesso negado. Permissões de administrador necessárias.");
    await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "access:manage", userId: me.id });
    return me;
}

// ── Public API ────────────────────────────────────────────────────────────────

type GrantResult = { status: "created"; password: string } | { status: "updated" | "unchanged" };

/**
 * Gives someone access. A new email gets an account with a temporary password
 * (returned once, never stored in clear); an existing account just gets the role.
 * `actorId` is null only for the operator CLI, where no session exists.
 */
async function grantAccess(
    ctx: ActionCtx,
    actorId: Id<"users"> | null,
    args: { email: string; name?: string; role: "admin" | "user" },
): Promise<GrantResult> {
    const email = normalizeEmail(args.email);
    validateEmail(email);
    const name = (args.name ?? "").trim();
    if (name) validateMaxLength(name, "nome", 80);

    const existing = await ctx.runQuery(internal.access.findByEmail, { email });
    if (existing) {
        if (existing.role === args.role) return { status: "unchanged" };
        await ctx.runMutation(internal.access.setRoleInternal, { actorId: actorId ?? existing.id, targetId: existing.id, role: args.role });
        return { status: "updated" };
    }
    const password = temporaryPassword();
    await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: password },
        profile: { email, role: args.role, ...(name ? { name } : {}) },
    });
    return { status: "created", password };
}

const grantArgs = { email: v.string(), name: v.optional(v.string()), role };

export const grant = action({
    args: grantArgs,
    handler: async (ctx, args): Promise<GrantResult> => {
        const me = await requireAdminActor(ctx);
        return grantAccess(ctx, me.id, args);
    },
});

/**
 * Operator fallback when nobody can sign in to the backoffice:
 * npx convex run --prod access:grantFromCli '{"email":"x@y.pt","role":"admin"}'
 */
export const grantFromCli = internalAction({
    args: grantArgs,
    handler: async (ctx, args): Promise<GrantResult> => grantAccess(ctx, null, args),
});

/** New temporary password for someone who forgot theirs; signs them out everywhere. */
export const resetPassword = action({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }): Promise<{ password: string }> => {
        await requireAdminActor(ctx);
        const email = await ctx.runQuery(internal.access.userEmail, { userId });
        if (!email) throw new ConvexError("Esta conta não tem email associado.");
        const password = temporaryPassword();
        await modifyAccountCredentials(ctx, { provider: "password", account: { id: email, secret: password } });
        await invalidateSessions(ctx, { userId });
        return { password };
    },
});

export const setRole = mutation({
    args: { userId: v.id("users"), role },
    handler: async (ctx, args) => {
        const { user } = await requireAdmin(ctx);
        await applyRoleChange(ctx, user._id, args.userId, args.role);
    },
});

/** Deletes an account and its sign-in data; the person can no longer enter. */
export const remove = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const { user } = await requireAdmin(ctx);
        const actorId = user._id;
        const target = await ctx.db.get(userId);
        if (!target) return;
        const problem = roleChangeProblem({
            actorId, targetId: userId, targetRole: target.role, nextRole: "removed", adminCount: await adminCount(ctx),
        });
        if (problem) throw new ConvexError(problem);
        const accounts = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", (q) => q.eq("userId", userId)).collect();
        for (const account of accounts) {
            const codes = await ctx.db.query("authVerificationCodes").withIndex("accountId", (q) => q.eq("accountId", account._id)).collect();
            for (const code of codes) await ctx.db.delete(code._id);
            await ctx.db.delete(account._id);
        }
        const sessions = await ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).collect();
        for (const session of sessions) {
            const tokens = await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", session._id)).collect();
            for (const token of tokens) await ctx.db.delete(token._id);
            await ctx.db.delete(session._id);
        }
        await ctx.db.delete(userId);
    },
});

/** Anyone signed in: replace the password, keeping this session and ending the others. */
export const changeOwnPassword = action({
    args: { current: v.string(), next: v.string() },
    handler: async (ctx, { current, next }) => {
        const me = await ctx.runQuery(internal.access.actor, {});
        if (!me || !me.email) throw new ConvexError("A sessão expirou. Volte a entrar.");
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "access:password", userId: me.id });
        const problem = passwordProblem(next);
        if (problem) throw new ConvexError(problem);
        if (next === current) throw new ConvexError("A nova palavra-passe tem de ser diferente da atual.");
        try {
            await retrieveAccount(ctx, { provider: "password", account: { id: me.email, secret: current } });
        } catch {
            throw new ConvexError("A palavra-passe atual não está correta.");
        }
        await modifyAccountCredentials(ctx, { provider: "password", account: { id: me.email, secret: next } });
        const sessionId = await getAuthSessionId(ctx);
        await invalidateSessions(ctx, { userId: me.id as Id<"users">, except: sessionId ? [sessionId] : [] });
    },
});
