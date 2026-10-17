import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { missingForSending, resolveEmailConfig, type ResolvedEmailConfig } from "./providers";
import { BOARD_KINDS, PARTICIPANT_KINDS, type EmailKind } from "./kinds";
import type { RegistrationEmailData, RenderedEmail } from "./templates";
import type { EmailSite } from "./layout";
import { calendarLink, formatWhen } from "./eventFormat";

/**
 * Putting an email on the way never fails the action that caused it: a
 * registration is saved whether or not the provider is up. Delivery runs in
 * the background (emailDelivery.deliver) and its outcome lands in emailLogs.
 */

/** Emails a visitor can trigger in an hour (the "email:public" bucket in lib/rateLimit.ts). */
export const HOURLY_EMAIL_CAP = 150;

export async function loadEmailConfig(ctx: QueryCtx | MutationCtx): Promise<ResolvedEmailConfig> {
    const stored = await ctx.db.query("emailSettings").first();
    const settings = await ctx.db.query("settings").first();
    return resolveEmailConfig(stored, process.env, { siteName: settings?.siteName ?? "Associação", contactEmail: settings?.contactEmail });
}

/** The identity an email is dressed in, from the same settings as the site. */
export async function loadEmailSite(ctx: QueryCtx | MutationCtx): Promise<EmailSite> {
    const settings = await ctx.db.query("settings").first();
    let siteUrl: string | undefined;
    try {
        siteUrl = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : undefined;
    } catch {
        siteUrl = undefined;
    }
    // Uploaded logos are absolute; a bundled one ("/logo.png") needs the site's origin
    const logo = settings?.logoUrl;
    // Gmail and Outlook do not show SVG, so an SVG logo falls back to the app icon,
    // which every instance already ships in its own brand
    const absolute = logo && /^https?:/.test(logo) ? logo : logo && siteUrl ? `${siteUrl}${logo.startsWith("/") ? "" : "/"}${logo}` : undefined;
    const logoUrl = absolute && !/\.svg(\?|$)/i.test(absolute) ? absolute : siteUrl ? `${siteUrl}/icons/icon-192.png` : undefined;
    return {
        siteName: settings?.siteName ?? "Associação",
        siteUrl,
        brandColor: settings?.brandColor ?? process.env.VITE_BRAND_COLOR ?? "#4f46e5",
        logoUrl,
        address: settings?.address,
        contactEmail: settings?.contactEmail,
        phone: settings?.phone,
    };
}

interface QueueInput {
    kind: EmailKind;
    to: string;
    toName?: string;
    email: RenderedEmail;
    relatedId?: string;
    /** Board replies set it to the person writing; everything else answers to the board. */
    replyTo?: string;
}

/** Header values come from what visitors type: a line break there would add headers. */
export function headerSafe(value: string, max = 200): string {
    return value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
}

/**
 * Emails a visitor can cause (a guest registration, a contact message) share
 * one hourly budget, so a bot cannot burn the provider's quota. What the board
 * sends itself (confirmations, replies, tests) is never held back by it.
 */
const PUBLIC_KINDS: EmailKind[] = ["registration_received", "board_registration", "board_contact", "board_sponsorship"];

/** A fresh id per scheduled delivery: only the run holding the current one may send. */
export function deliveryToken(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function withinPublicBudget(ctx: MutationCtx): Promise<boolean> {
    try {
        // Runs as a sub-transaction: when it throws, its write is undone and we carry on
        await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "email:public" });
        return true;
    } catch {
        return false;
    }
}

/**
 * Logs and schedules one email, or does nothing when email is off, the switch
 * for this kind is off, or nobody would receive it. Returns the log id when queued.
 */
export async function queueEmail(ctx: MutationCtx, input: QueueInput): Promise<Id<"emailLogs"> | null> {
    const config = await loadEmailConfig(ctx);
    const isTest = input.kind === "test";
    const missing = missingForSending(config);
    if (!isTest && missing.length) return null;
    if (PARTICIPANT_KINDS.includes(input.kind) && !config.notifyParticipants) return null;
    if (BOARD_KINDS.includes(input.kind) && !config.notifyBoard) return null;
    const to = headerSafe(input.to, 254);
    if (!to) return null;

    const capped = PUBLIC_KINDS.includes(input.kind) && !(await withinPublicBudget(ctx));
    const replyTo = headerSafe(input.replyTo ?? config.replyTo ?? "", 254) || undefined;
    const token = deliveryToken();
    const id = await ctx.db.insert("emailLogs", {
        kind: input.kind,
        to,
        toName: input.toName ? headerSafe(input.toName, 100) : undefined,
        subject: headerSafe(input.email.subject),
        html: input.email.html,
        text: input.email.text,
        replyTo,
        status: capped || missing.length ? "skipped" : "queued",
        provider: config.provider,
        attempts: 0,
        error: missing.length
            ? `Falta configurar: ${missing.join(", ")}.`
            : capped ? `Limite de ${HOURLY_EMAIL_CAP} emails por hora vindos do site atingido; este não foi enviado.` : undefined,
        relatedId: input.relatedId,
        deliveryToken: token,
        createdAt: Date.now(),
    });
    if (!capped && !missing.length) await ctx.scheduler.runAfter(0, internal.emailDelivery.deliver, { logId: id, token });
    return id;
}

/** Long answers are cut in emails: the full text stays in the backoffice. */
const ANSWER_MAX = 300;

/** What every registration email shows about the event and the person. */
export function registrationData(row: Doc<"registrations">, event: Doc<"events">, siteUrl?: string): RegistrationEmailData {
    const fields = new Map((event.registrationFields ?? []).map((f) => [f.id, f.label]));
    const players = [row.name, ...(row.teamMembers ?? [])].filter(Boolean).join(", ");
    const eventPath = `/events/${event.slug}`;
    return {
        name: row.name,
        email: row.email || undefined,
        phone: row.phone,
        eventTitle: event.title,
        when: formatWhen(event.date),
        location: event.location,
        team: (event.teamSize ?? 1) >= 2 ? (row.teamName ? `${row.teamName} · ${players}` : players) : undefined,
        price: event.entryPrice || undefined,
        eventPath,
        calendarUrl: calendarLink(event, siteUrl ? `${siteUrl}${eventPath}` : undefined),
        answers: Object.entries(row.customData ?? {}).map(([id, value]) => {
            const text = String(value);
            return { label: fields.get(id) ?? id, value: text.length > ANSWER_MAX ? `${text.slice(0, ANSWER_MAX)}…` : text };
        }),
        guest: !row.userId && !row.addedByAdmin,
    };
}
