import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { isAdmin, requireAdmin } from "./lib/auth";
import { validateEmail, validateMaxLength } from "./lib/validation";
import { deliveryToken, loadEmailConfig, loadEmailSite, queueEmail } from "./lib/email/queue";
import { missingForSending, PROVIDER_LABELS } from "./lib/email/providers";
import {
    boardContact, boardRegistration, contactReply, registrationCancelled, registrationConfirmed, registrationReceived, testEmail,
    type RegistrationEmailData,
} from "./lib/email/templates";
import { calendarLink, formatWhen } from "./lib/email/eventFormat";

/** Admin > Email: configuration, the delivery log, a test and replies to messages. */

const provider = v.union(v.literal("none"), v.literal("resend"), v.literal("brevo"), v.literal("postmark"), v.literal("graph"), v.literal("smtp"));
const SECRETS = ["resendApiKey", "brevoApiKey", "postmarkToken", "graphClientSecret", "smtpPassword"] as const;
/** A send that has not answered in this long is taken over or given up. */
const STUCK_MS = 10 * 60 * 1000;
const LOG_DAYS = 90;
const MAX_ATTEMPTS = 3;
/** Wait before the second and third try: a minute, then ten. */
const RETRY_DELAYS = [60_000, 600_000];

export const getAdmin = query({
    args: {},
    handler: async (ctx) => {
        if (!(await isAdmin(ctx).catch(() => false))) return null;
        const stored = await ctx.db.query("emailSettings").first();
        const resolved = await loadEmailConfig(ctx);
        const settings = await ctx.db.query("settings").first();
        const env = process.env;
        return {
            provider: stored?.provider ?? resolved.provider,
            fromName: stored?.fromName, fromAddress: stored?.fromAddress, replyTo: stored?.replyTo, boardAddress: stored?.boardAddress,
            notifyParticipants: stored?.notifyParticipants, notifyBoard: stored?.notifyBoard,
            smtpHost: stored?.smtpHost, smtpPort: stored?.smtpPort, smtpSecurity: stored?.smtpSecurity, smtpUser: stored?.smtpUser,
            graphTenantId: stored?.graphTenantId, graphClientId: stored?.graphClientId,
            updatedAt: stored?.updatedAt,
            // Secrets never leave the server: only whether one is stored
            hasResendApiKey: Boolean(stored?.resendApiKey), hasBrevoApiKey: Boolean(stored?.brevoApiKey),
            hasPostmarkToken: Boolean(stored?.postmarkToken), hasSmtpPassword: Boolean(stored?.smtpPassword),
            hasGraphClientSecret: Boolean(stored?.graphClientSecret),
            // Keys set on the deployment instead of here: the form says so instead of asking again
            envKeys: {
                resend: Boolean(env.RESEND_API_KEY), brevo: Boolean(env.BREVO_API_KEY),
                postmark: Boolean(env.POSTMARK_SERVER_TOKEN), smtp: Boolean(env.SMTP_HOST && env.SMTP_PASSWORD),
                graph: Boolean(env.MS_GRAPH_CLIENT_SECRET),
            },
            missing: missingForSending(resolved),
            defaults: { fromName: settings?.siteName ?? "", contactEmail: settings?.contactEmail ?? "" },
            siteUrlConfigured: Boolean(env.SITE_URL),
        };
    },
});

/** Visitors only learn whether registrations get an email, to say so on the confirmation screen. */
export const publicStatus = query({
    args: {},
    handler: async (ctx) => {
        const config = await loadEmailConfig(ctx);
        return { participantsNotified: missingForSending(config).length === 0 && config.notifyParticipants };
    },
});

export const update = mutation({
    args: {
        provider,
        fromName: v.optional(v.string()),
        fromAddress: v.optional(v.string()),
        replyTo: v.optional(v.string()),
        boardAddress: v.optional(v.string()),
        notifyParticipants: v.optional(v.boolean()),
        notifyBoard: v.optional(v.boolean()),
        smtpHost: v.optional(v.string()),
        smtpPort: v.optional(v.number()),
        smtpSecurity: v.optional(v.union(v.literal("ssl"), v.literal("starttls"))),
        smtpUser: v.optional(v.string()),
        graphTenantId: v.optional(v.string()),
        graphClientId: v.optional(v.string()),
        /** Secrets: absent keeps what is stored, "" removes it. */
        resendApiKey: v.optional(v.string()),
        brevoApiKey: v.optional(v.string()),
        postmarkToken: v.optional(v.string()),
        graphClientSecret: v.optional(v.string()),
        smtpPassword: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        for (const key of ["fromAddress", "replyTo", "boardAddress"] as const) {
            const value = args[key]?.trim();
            if (value) {
                validateMaxLength(value, key, 254);
                if (!validateEmail(value)) throw new ConvexError(`O endereço “${value}” não é um email válido.`);
            }
        }
        if (args.fromName !== undefined) validateMaxLength(args.fromName, "nome do remetente", 100);
        if (args.smtpHost !== undefined) validateMaxLength(args.smtpHost, "servidor SMTP", 200);
        if (args.smtpUser !== undefined) validateMaxLength(args.smtpUser, "utilizador SMTP", 254);
        for (const key of ["graphTenantId", "graphClientId"] as const) {
            const value = args[key]?.trim();
            // Both are GUIDs in Entra; a typo here only surfaces as a login error later
            if (value && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) && !(key === "graphTenantId" && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value))) {
                throw new ConvexError(key === "graphTenantId" ? "O ID do diretório tem o formato 00000000-0000-0000-0000-000000000000 (ou o domínio, ex.: associacao.onmicrosoft.com)." : "O ID da aplicação tem o formato 00000000-0000-0000-0000-000000000000.");
            }
        }
        // 0 is how the form clears the port back to the default for the security mode
        if (args.smtpPort !== undefined && args.smtpPort !== 0 && (!Number.isInteger(args.smtpPort) || args.smtpPort < 1 || args.smtpPort > 65535)) {
            throw new ConvexError("A porta SMTP tem de ser um número entre 1 e 65535.");
        }
        for (const key of SECRETS) if (args[key] !== undefined) validateMaxLength(args[key] as string, key, 500);

        const patch: Record<string, unknown> = { updatedAt: Date.now() };
        for (const [key, value] of Object.entries(args)) {
            if (value === undefined) continue;
            patch[key] = typeof value === "string" ? value.trim() || undefined : key === "smtpPort" && value === 0 ? undefined : value;
        }
        const existing = await ctx.db.query("emailSettings").first();
        if (existing) await ctx.db.patch(existing._id, patch);
        else await ctx.db.insert("emailSettings", { ...(patch as { updatedAt: number }), provider: args.provider });
    },
});

export const listLogs = query({
    args: {},
    handler: async (ctx) => {
        if (!(await isAdmin(ctx).catch(() => false))) return [];
        const rows = await ctx.db.query("emailLogs").withIndex("by_createdAt").order("desc").take(100);
        return rows.map(({ html: _html, text: _text, ...row }) => row);
    },
});

export const getLog = query({
    args: { id: v.id("emailLogs") },
    handler: async (ctx, args) => {
        if (!(await isAdmin(ctx).catch(() => false))) return null;
        return await ctx.db.get(args.id);
    },
});

const PREVIEW_KIND = v.union(
    v.literal("registration_received"), v.literal("registration_confirmed"), v.literal("registration_cancelled"),
    v.literal("board_registration"), v.literal("board_contact"), v.literal("contact_reply"),
);

/**
 * An email as it would go out, with the site's identity and a made-up person,
 * so the board sees what it is switching on without sending anything.
 */
export const previewTemplate = query({
    args: { kind: PREVIEW_KIND },
    handler: async (ctx, args) => {
        if (!(await isAdmin(ctx).catch(() => false))) return null;
        const site = await loadEmailSite(ctx);
        const next = await ctx.db.query("events").withIndex("by_status", (q) => q.eq("status", "published")).order("desc").first();
        const date = next?.date ?? "2026-12-05T15:00";
        const data: RegistrationEmailData = {
            name: "Ana Silva", email: "ana.silva@exemplo.pt", phone: "912 345 678",
            eventTitle: next?.title ?? "Torneio de Sueca", when: formatWhen(date), location: next?.location ?? "Sede",
            price: next?.entryPrice || undefined, eventPath: next ? `/events/${next.slug}` : undefined,
            calendarUrl: calendarLink({ title: next?.title ?? "Torneio de Sueca", date, location: next?.location }), guest: true,
        };
        const contact = { name: "Ana Silva", email: "ana.silva@exemplo.pt", subject: "Aluguer do salão", message: "Olá! O salão está livre no dia 14 para um aniversário?" };
        switch (args.kind) {
            case "registration_received": return registrationReceived(site, data);
            case "registration_confirmed": return registrationConfirmed(site, data);
            case "registration_cancelled": return registrationCancelled(site, data);
            case "board_registration": return boardRegistration(site, data);
            case "board_contact": return boardContact(site, contact);
            case "contact_reply": return contactReply(site, { name: "Ana Silva", subject: contact.subject, original: contact.message, reply: "Olá Ana,\n\nSim, está livre. Ligue-nos para combinarmos.\n\nCumprimentos", signature: `— ${site.siteName}` });
        }
    },
});

export const sendTest = mutation({
    args: { to: v.string() },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const to = args.to.trim();
        if (!validateEmail(to)) throw new ConvexError("Escreva um email válido para receber o teste.");
        const config = await loadEmailConfig(ctx);
        const site = await loadEmailSite(ctx);
        return await queueEmail(ctx, { kind: "test", to, email: testEmail(site, PROVIDER_LABELS[config.provider]) });
    },
});

export const retry = mutation({
    args: { id: v.id("emailLogs") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const log = await ctx.db.get(args.id);
        if (!log || (log.status !== "failed" && log.status !== "skipped")) return;
        const config = await loadEmailConfig(ctx);
        const missing = missingForSending(config);
        if (missing.length) throw new ConvexError(`Falta configurar: ${missing.join(", ")}.`);
        // A new token: any retry still scheduled from before is ignored when it fires
        const token = deliveryToken();
        await ctx.db.patch(args.id, { status: "queued", attempts: 0, error: undefined, provider: config.provider, deliveryToken: token, sendingAt: undefined });
        await ctx.scheduler.runAfter(0, internal.emailDelivery.deliver, { logId: args.id, token });
    },
});

export const removeLog = mutation({
    args: { id: v.id("emailLogs") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const log = await ctx.db.get(args.id);
        // A message on its way is left alone, unless its send died and never answered
        const stuck = log?.status === "sending" && (log.sendingAt ?? 0) < Date.now() - STUCK_MS;
        if (log && ((log.status !== "queued" && log.status !== "sending") || stuck)) await ctx.db.delete(args.id);
    },
});

/** The board answers a message from the contact form without leaving the backoffice. */
export const replyToContact = mutation({
    args: { id: v.id("contactSubmissions"), message: v.string() },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        const message = args.message.trim();
        if (!message) throw new ConvexError("Escreva a resposta.");
        validateMaxLength(message, "resposta", 5000);
        const submission = await ctx.db.get(args.id);
        if (!submission) throw new ConvexError("Mensagem não encontrada.");
        const config = await loadEmailConfig(ctx);
        const missing = missingForSending(config);
        if (missing.length) throw new ConvexError(`O email ainda não está configurado (falta: ${missing.join(", ")}). Abra o separador Email.`);
        const site = await loadEmailSite(ctx);
        const email = contactReply(site, {
            name: submission.name, subject: submission.subject, original: submission.message, reply: message,
            signature: `— ${config.fromName}`,
        });
        const id = await queueEmail(ctx, { kind: "contact_reply", to: submission.email, toName: submission.name, email, relatedId: args.id });
        await ctx.db.patch(args.id, { status: "replied" });
        return id;
    },
});

// ── Delivery (called by emailDelivery.deliver) ───────────────────────────────

export const loadForDelivery = internalQuery({
    args: { logId: v.id("emailLogs") },
    handler: async (ctx, args) => {
        const log = await ctx.db.get(args.logId);
        if (!log) return null;
        return { log, config: await loadEmailConfig(ctx) };
    },
});

export const markSending = internalMutation({
    args: { logId: v.id("emailLogs"), token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const log = await ctx.db.get(args.logId);
        if (!log || log.status === "sent" || log.status === "failed" || log.status === "skipped") return false;
        // A stale retry, superseded by a manual one, does nothing
        if (log.deliveryToken && args.token !== log.deliveryToken) return false;
        // Another run is sending, unless it died long ago without answering
        if (log.status === "sending" && (log.sendingAt ?? 0) > Date.now() - STUCK_MS) return false;
        await ctx.db.patch(args.logId, { status: "sending", attempts: log.attempts + 1, sendingAt: Date.now() });
        return true;
    },
});

export const recordResult = internalMutation({
    args: {
        logId: v.id("emailLogs"),
        ok: v.boolean(),
        provider: v.string(),
        messageId: v.optional(v.string()),
        error: v.optional(v.string()),
        retryable: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const log = await ctx.db.get(args.logId);
        if (!log) return;
        if (args.ok) {
            await ctx.db.patch(args.logId, { status: "sent", sentAt: Date.now(), messageId: args.messageId, provider: args.provider, error: undefined });
            return;
        }
        const again = args.retryable && log.attempts < MAX_ATTEMPTS;
        const token = again ? deliveryToken() : log.deliveryToken;
        await ctx.db.patch(args.logId, {
            status: again ? "queued" : "failed",
            provider: args.provider,
            deliveryToken: token,
            error: again ? `${args.error} (nova tentativa ${log.attempts + 1} de ${MAX_ATTEMPTS})` : args.error,
        });
        if (again) await ctx.scheduler.runAfter(RETRY_DELAYS[log.attempts - 1] ?? 600_000, internal.emailDelivery.deliver, { logId: args.logId, token });
    },
});

/**
 * A delivery that crashed mid-send (a deploy, a timeout) leaves its row on
 * "sending". Every quarter of an hour those are tried again or given up.
 */
export const recoverStuck = internalMutation({
    args: {},
    handler: async (ctx) => {
        const recent = await ctx.db.query("emailLogs").withIndex("by_createdAt", (q) => q.gt("createdAt", Date.now() - 2 * 86_400_000)).take(1000);
        const stuck = recent.filter((r) => r.status === "sending" && (r.sendingAt ?? 0) < Date.now() - STUCK_MS);
        for (const row of stuck) {
            const again = row.attempts < MAX_ATTEMPTS;
            const token = deliveryToken();
            await ctx.db.patch(row._id, {
                status: again ? "queued" : "failed",
                deliveryToken: token,
                error: again ? "O envio anterior ficou sem resposta; vamos tentar de novo." : "O envio ficou sem resposta do provedor. Carregue em Reenviar.",
            });
            if (again) await ctx.scheduler.runAfter(0, internal.emailDelivery.deliver, { logId: row._id, token });
        }
        return stuck.length;
    },
});

export const purgeOldLogs = internalMutation({
    args: {},
    handler: async (ctx) => {
        const old = await ctx.db.query("emailLogs").withIndex("by_createdAt", (q) => q.lt("createdAt", Date.now() - LOG_DAYS * 86_400_000)).take(500);
        for (const row of old) await ctx.db.delete(row._id);
        if (old.length === 500) await ctx.scheduler.runAfter(0, internal.email.purgeOldLogs, {});
        return old.length;
    },
});
