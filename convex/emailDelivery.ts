"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";
import { internal } from "./_generated/api";
import {
    buildHttpRequest, classifyGraphFailure, classifyHttpFailure, classifySmtpFailure, formatFrom, graphSendRequest,
    graphTokenRequest, messageIdFrom, missingForSending,
    type HttpProviderId, type HttpRequest, type OutgoingEmail, type ResolvedEmailConfig, type SendFailure,
} from "./lib/email/providers";

/**
 * Sends one queued email. Runs on Node because SMTP needs sockets; the HTTP
 * providers go through fetch. Retries and the final state are decided by
 * email.recordResult, so this only reports what happened, whatever happens.
 */

const TIMEOUT_MS = 20_000;

/** Flat rather than a union: the Convex tsconfig is not strict enough to narrow on `ok`. */
type Outcome = { ok: boolean; messageId?: string } & Partial<SendFailure>;

const NETWORK_FAILURE: Outcome = { ok: false, retryable: true, message: "Sem ligação ao provedor de email. Tentamos de novo daqui a pouco." };
const TIMEOUT_FAILURE: Outcome = { ok: false, retryable: true, message: "O provedor não respondeu a tempo. Tentamos de novo daqui a pouco." };

async function post(request: HttpRequest): Promise<{ status: number; ok: boolean; raw: string; body: unknown }> {
    const response = await fetch(request.url, { method: "POST", headers: request.headers, body: request.body, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const raw = await response.text();
    let body: unknown;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
    return { status: response.status, ok: response.ok, raw, body };
}

function errorText(body: unknown, raw: string): string {
    if (!body || typeof body !== "object") return raw;
    const data = body as Record<string, unknown>;
    const nested = data.error && typeof data.error === "object" ? (data.error as Record<string, unknown>) : null;
    return String(nested?.message ?? nested?.code ?? data.error_description ?? data.message ?? data.Message ?? raw);
}

const isTimeout = (error: unknown) => error instanceof Error && error.name === "TimeoutError";

async function sendHttp(provider: HttpProviderId, config: ResolvedEmailConfig, email: OutgoingEmail): Promise<Outcome> {
    try {
        const result = await post(buildHttpRequest(provider, config.apiKey ?? "", { name: config.fromName, address: config.fromAddress }, email));
        if (result.ok) return { ok: true, messageId: messageIdFrom(provider, result.body) };
        return { ok: false, ...classifyHttpFailure(result.status, errorText(result.body, result.raw)) };
    } catch (error) {
        return isTimeout(error) ? TIMEOUT_FAILURE : NETWORK_FAILURE;
    }
}

async function sendGraph(config: ResolvedEmailConfig, email: OutgoingEmail): Promise<Outcome> {
    const graph = config.graph ?? {};
    try {
        const token = await post(graphTokenRequest(graph.tenantId ?? "", graph.clientId ?? "", graph.clientSecret ?? ""));
        const accessToken = (token.body as { access_token?: string } | null)?.access_token;
        if (!token.ok || !accessToken) return { ok: false, ...classifyGraphFailure("token", token.status, errorText(token.body, token.raw)) };
        const sent = await post(graphSendRequest(accessToken, config.fromAddress, email));
        // 202 Accepted, no id: Exchange keeps its own trace in the message tracking log
        if (sent.ok) return { ok: true };
        return { ok: false, ...classifyGraphFailure("send", sent.status, errorText(sent.body, sent.raw)) };
    } catch (error) {
        return isTimeout(error) ? TIMEOUT_FAILURE : NETWORK_FAILURE;
    }
}

async function sendSmtp(config: ResolvedEmailConfig, email: OutgoingEmail): Promise<Outcome> {
    const smtp = config.smtp;
    if (!smtp) return { ok: false, retryable: false, message: "Falta o servidor SMTP." };
    let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
    try {
        transport = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.security === "ssl",
            requireTLS: smtp.security === "starttls",
            auth: smtp.user ? { user: smtp.user, pass: smtp.password ?? "" } : undefined,
            connectionTimeout: TIMEOUT_MS,
            greetingTimeout: TIMEOUT_MS,
            socketTimeout: TIMEOUT_MS,
        });
        const info = await transport.sendMail({
            from: formatFrom(config.fromName, config.fromAddress),
            to: email.toName ? { name: email.toName, address: email.to } : email.to,
            replyTo: email.replyTo,
            subject: email.subject,
            html: email.html,
            text: email.text,
        });
        return { ok: true, messageId: info.messageId };
    } catch (error) {
        return { ok: false, ...classifySmtpFailure(error as { code?: string; responseCode?: number; message?: string }) };
    } finally {
        transport?.close();
    }
}

async function send(config: ResolvedEmailConfig, email: OutgoingEmail): Promise<Outcome> {
    // The configuration may have changed since this email was queued
    const missing = missingForSending(config);
    if (missing.length) return { ok: false, retryable: false, message: `Falta configurar: ${missing.join(", ")}.` };
    if (config.provider === "smtp") return sendSmtp(config, email);
    if (config.provider === "graph") return sendGraph(config, email);
    if (config.provider === "resend" || config.provider === "brevo" || config.provider === "postmark") return sendHttp(config.provider, config, email);
    return { ok: false, retryable: false, message: "O envio de emails está desligado." };
}

export const deliver = internalAction({
    args: { logId: v.id("emailLogs"), token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const loaded = await ctx.runQuery(internal.email.loadForDelivery, { logId: args.logId });
        if (!loaded) return;
        const { log, config } = loaded;
        if (!(await ctx.runMutation(internal.email.markSending, { logId: args.logId, token: args.token }))) return;

        let outcome: Outcome;
        try {
            outcome = await send(config, { to: log.to, toName: log.toName, subject: log.subject, html: log.html, text: log.text, replyTo: log.replyTo });
        } catch (error) {
            // Anything unexpected still ends in a recorded, retryable state, never in "sending" forever
            outcome = { ok: false, retryable: true, message: `Erro inesperado no envio: ${error instanceof Error ? error.message.slice(0, 120) : "desconhecido"}` };
        }
        if (outcome.ok) {
            await ctx.runMutation(internal.email.recordResult, { logId: args.logId, ok: true, provider: config.provider, messageId: outcome.messageId });
        } else {
            await ctx.runMutation(internal.email.recordResult, { logId: args.logId, ok: false, provider: config.provider, error: outcome.message ?? "Falha desconhecida no envio.", retryable: outcome.retryable ?? false });
        }
    },
});
