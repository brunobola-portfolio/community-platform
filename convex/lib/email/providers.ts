/**
 * Which service sends the email and how. Pure: building the request, reading
 * the answer and naming the failure are tested without a network.
 */

export type EmailProviderId = "none" | "resend" | "brevo" | "postmark" | "graph" | "smtp";
export type HttpProviderId = "resend" | "brevo" | "postmark";
export type SmtpSecurity = "ssl" | "starttls";

export const PROVIDER_LABELS: Record<EmailProviderId, string> = {
    none: "Desligado",
    resend: "Resend",
    brevo: "Brevo",
    postmark: "Postmark",
    graph: "Microsoft 365",
    smtp: "SMTP",
};

/** What the backoffice stores; every field optional, secrets write-only. */
export interface StoredEmailConfig {
    provider?: EmailProviderId;
    fromName?: string;
    fromAddress?: string;
    replyTo?: string;
    boardAddress?: string;
    notifyParticipants?: boolean;
    notifyBoard?: boolean;
    resendApiKey?: string;
    brevoApiKey?: string;
    postmarkToken?: string;
    graphTenantId?: string;
    graphClientId?: string;
    graphClientSecret?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecurity?: SmtpSecurity;
    smtpUser?: string;
    smtpPassword?: string;
}

export interface ResolvedEmailConfig {
    provider: EmailProviderId;
    fromName: string;
    fromAddress: string;
    replyTo?: string;
    boardAddress?: string;
    notifyParticipants: boolean;
    notifyBoard: boolean;
    apiKey?: string;
    smtp?: { host: string; port: number; security: SmtpSecurity; user?: string; password?: string };
    graph?: { tenantId?: string; clientId?: string; clientSecret?: string };
}

export interface OutgoingEmail {
    to: string;
    toName?: string;
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
}

export interface HttpRequest {
    url: string;
    headers: Record<string, string>;
    body: string;
}

type Env = Record<string, string | undefined>;

const PROVIDERS: EmailProviderId[] = ["none", "resend", "brevo", "postmark", "graph", "smtp"];

const pick = (stored: string | undefined, env: string | undefined) => (stored?.trim() ? stored.trim() : env?.trim() || undefined);

/**
 * Backoffice first, then the deployment's environment, like every other
 * setting. The board can run the whole thing from the backoffice; a host that
 * prefers keys out of the database sets them on the deployment instead.
 */
export function resolveEmailConfig(stored: StoredEmailConfig | null, env: Env, fallback: { siteName: string; contactEmail?: string }): ResolvedEmailConfig {
    const rawProvider = stored?.provider ?? (env.EMAIL_PROVIDER as EmailProviderId | undefined);
    const provider: EmailProviderId = rawProvider && PROVIDERS.includes(rawProvider) ? rawProvider : "none";
    const keys: Record<HttpProviderId, string | undefined> = {
        resend: pick(stored?.resendApiKey, env.RESEND_API_KEY),
        brevo: pick(stored?.brevoApiKey, env.BREVO_API_KEY),
        postmark: pick(stored?.postmarkToken, env.POSTMARK_SERVER_TOKEN),
    };
    const host = pick(stored?.smtpHost, env.SMTP_HOST);
    const security = (stored?.smtpSecurity ?? env.SMTP_SECURITY) === "starttls" ? "starttls" : "ssl";
    const port = stored?.smtpPort ?? (env.SMTP_PORT ? Number(env.SMTP_PORT) : security === "ssl" ? 465 : 587);
    return {
        provider,
        fromName: pick(stored?.fromName, env.EMAIL_FROM_NAME) ?? fallback.siteName,
        fromAddress: pick(stored?.fromAddress, env.EMAIL_FROM_ADDRESS) ?? "",
        replyTo: pick(stored?.replyTo, undefined) ?? fallback.contactEmail,
        boardAddress: pick(stored?.boardAddress, undefined) ?? fallback.contactEmail,
        notifyParticipants: stored?.notifyParticipants ?? true,
        notifyBoard: stored?.notifyBoard ?? true,
        apiKey: provider === "resend" || provider === "brevo" || provider === "postmark" ? keys[provider] : undefined,
        smtp: host ? { host, port, security, user: pick(stored?.smtpUser, env.SMTP_USER), password: pick(stored?.smtpPassword, env.SMTP_PASSWORD) } : undefined,
        graph: {
            tenantId: pick(stored?.graphTenantId, env.MS_GRAPH_TENANT_ID),
            clientId: pick(stored?.graphClientId, env.MS_GRAPH_CLIENT_ID),
            clientSecret: pick(stored?.graphClientSecret, env.MS_GRAPH_CLIENT_SECRET),
        },
    };
}

/** What is still missing before the chosen provider can send; empty when ready. */
export function missingForSending(config: ResolvedEmailConfig): string[] {
    if (config.provider === "none") return ["Escolha um provedor"];
    const missing: string[] = [];
    if (!config.fromAddress) missing.push("Email do remetente");
    if (config.provider === "smtp") {
        if (!config.smtp?.host) missing.push("Servidor SMTP");
        if (!config.smtp?.password) missing.push("Palavra-passe SMTP");
    } else if (config.provider === "graph") {
        if (!config.graph?.tenantId) missing.push("ID do diretório (tenant)");
        if (!config.graph?.clientId) missing.push("ID da aplicação (client)");
        if (!config.graph?.clientSecret) missing.push("Segredo da aplicação");
    } else if (!config.apiKey) {
        missing.push(config.provider === "postmark" ? "Server token do Postmark" : `Chave de API do ${PROVIDER_LABELS[config.provider]}`);
    }
    return missing;
}

/** "Nome <email>", with the name quoted when it holds characters that would break the header. */
export function formatFrom(name: string, address: string): string {
    const clean = name.replace(/["\r\n<>]/g, "").trim();
    return clean ? `"${clean}" <${address}>` : address;
}

export function buildHttpRequest(provider: HttpProviderId, apiKey: string, from: { name: string; address: string }, email: OutgoingEmail): HttpRequest {
    const json = { "Content-Type": "application/json", Accept: "application/json" };
    switch (provider) {
        case "resend":
            return {
                url: "https://api.resend.com/emails",
                headers: { ...json, Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                    from: formatFrom(from.name, from.address),
                    to: [email.to],
                    subject: email.subject,
                    html: email.html,
                    text: email.text,
                    ...(email.replyTo ? { reply_to: email.replyTo } : {}),
                }),
            };
        case "brevo":
            return {
                url: "https://api.brevo.com/v3/smtp/email",
                headers: { ...json, "api-key": apiKey },
                body: JSON.stringify({
                    sender: { name: from.name, email: from.address },
                    to: [{ email: email.to, ...(email.toName ? { name: email.toName } : {}) }],
                    subject: email.subject,
                    htmlContent: email.html,
                    textContent: email.text,
                    ...(email.replyTo ? { replyTo: { email: email.replyTo } } : {}),
                }),
            };
        case "postmark":
            return {
                url: "https://api.postmarkapp.com/email",
                headers: { ...json, "X-Postmark-Server-Token": apiKey },
                body: JSON.stringify({
                    From: formatFrom(from.name, from.address),
                    To: email.to,
                    Subject: email.subject,
                    HtmlBody: email.html,
                    TextBody: email.text,
                    MessageStream: "outbound",
                    ...(email.replyTo ? { ReplyTo: email.replyTo } : {}),
                }),
            };
    }
}

/** The provider's id for the message, kept in the log to trace a complaint. */
export function messageIdFrom(provider: HttpProviderId, body: unknown): string | undefined {
    const data = (body ?? {}) as Record<string, unknown>;
    const id = provider === "resend" ? data.id : provider === "brevo" ? data.messageId : data.MessageID;
    return typeof id === "string" ? id : undefined;
}

export interface SendFailure {
    /** Worth trying again later: rate limits, outages, timeouts. */
    retryable: boolean;
    /** For the board, in Portuguese, with what to do. */
    message: string;
}

/** Turns a provider's HTTP answer into something the board can act on. */
export function classifyHttpFailure(status: number, detail: string): SendFailure {
    const said = detail.replace(/\s+/g, " ").trim().slice(0, 160);
    const suffix = said ? ` (${said})` : "";
    if (status === 401 || status === 403) {
        return { retryable: false, message: `A chave foi recusada pelo provedor. Confirme-a ou crie uma nova.${suffix}` };
    }
    if (status === 422 || status === 400) {
        const domain = /domain|sender|from|verif/i.test(detail);
        return {
            retryable: false,
            message: domain
                ? `O provedor não aceita este remetente. Verifique o domínio do email do remetente no provedor.${suffix}`
                : `O provedor recusou a mensagem.${suffix}`,
        };
    }
    if (status === 429) return { retryable: true, message: "O provedor está a limitar envios. Tentamos de novo daqui a pouco." };
    if (status >= 500) return { retryable: true, message: `O provedor está com problemas (${status}). Tentamos de novo daqui a pouco.` };
    return { retryable: false, message: `O provedor respondeu ${status}.${suffix}` };
}

// ── Microsoft Graph (Microsoft 365 / Exchange Online) ───────────────────────

/** Client-credentials token request: the app acts on its own, no person signs in. */
export function graphTokenRequest(tenantId: string, clientId: string, clientSecret: string): HttpRequest {
    return {
        url: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            scope: "https://graph.microsoft.com/.default",
            grant_type: "client_credentials",
        }).toString(),
    };
}

/** sendMail from the sender's own mailbox; Graph answers 202 with no body. */
export function graphSendRequest(accessToken: string, sender: string, email: OutgoingEmail): HttpRequest {
    return {
        url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
            message: {
                subject: email.subject,
                body: { contentType: "HTML", content: email.html },
                toRecipients: [{ emailAddress: { address: email.to, ...(email.toName ? { name: email.toName } : {}) } }],
                ...(email.replyTo ? { replyTo: [{ emailAddress: { address: email.replyTo } }] } : {}),
            },
            // The board's Sent Items would fill with every confirmation the site sends
            saveToSentItems: false,
        }),
    };
}

/** Entra (token) and Exchange (sendMail) errors, named for the person who set the app up. */
export function classifyGraphFailure(stage: "token" | "send", status: number, detail: string): SendFailure {
    const said = detail.replace(/\s+/g, " ").trim().slice(0, 160);
    const suffix = said ? ` (${said})` : "";
    if (stage === "token") {
        if (/AADSTS90002|AADSTS900023/.test(detail)) return { retryable: false, message: `O ID do diretório (tenant) não existe. Copie-o de Entra › Visão geral.${suffix}` };
        if (/AADSTS700016/.test(detail)) return { retryable: false, message: `A aplicação não existe neste diretório. Confirme o ID da aplicação (client).${suffix}` };
        if (/AADSTS7000215|AADSTS7000222/.test(detail)) return { retryable: false, message: `O segredo da aplicação está errado ou expirou. Crie um novo em Certificados e segredos.${suffix}` };
        if (status >= 500 || status === 429) return { retryable: true, message: "O serviço de login da Microsoft não respondeu. Tentamos de novo daqui a pouco." };
        return { retryable: false, message: `A Microsoft recusou o login da aplicação.${suffix}` };
    }
    if (status === 403 || /ErrorAccessDenied|Authorization_RequestDenied/i.test(detail)) {
        return { retryable: false, message: `A aplicação não tem a permissão Mail.Send (de aplicação) com consentimento de administrador.${suffix}` };
    }
    if (status === 404 || /ErrorInvalidUser|MailboxNotEnabledForRESTAPI|ResourceNotFound/i.test(detail)) {
        return { retryable: false, message: `A caixa do remetente não existe no Microsoft 365. O email do remetente tem de ser uma caixa (ou caixa partilhada) da organização.${suffix}` };
    }
    return classifyHttpFailure(status, detail);
}

/** SMTP and network errors carry codes, not statuses. */
export function classifySmtpFailure(error: { code?: string; responseCode?: number; message?: string }): SendFailure {
    const code = error.code ?? "";
    if (code === "EAUTH" || error.responseCode === 535) {
        return { retryable: false, message: "O servidor SMTP recusou o utilizador ou a palavra-passe. No Gmail e no Outlook use uma palavra-passe de aplicação." };
    }
    if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ECONNREFUSED", "ENOTFOUND"].includes(code)) {
        return { retryable: true, message: `Não foi possível ligar ao servidor SMTP (${code}). Confirme o servidor, a porta e a segurança.` };
    }
    if (error.responseCode && error.responseCode >= 500) {
        return { retryable: false, message: `O servidor SMTP recusou a mensagem (${error.responseCode}). ${(error.message ?? "").slice(0, 120)}` };
    }
    return { retryable: true, message: `Falha no envio por SMTP. ${(error.message ?? "").slice(0, 120)}` };
}
