import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { validateEmail, validateMaxLength } from "./validation";

/**
 * One path into the registrations table, shared by members and guests, so the
 * rules a club relies on — capacity, duplicates, closed registrations — cannot
 * drift between the two.
 */

export type CustomData = Record<string, string | number | boolean>;

export interface RegistrationInput {
    eventId: Id<"events">;
    name: string;
    email: string;
    phone?: string;
    customData?: CustomData;
    userId?: Id<"users">;
    /** When the privacy notice was shown and the form sent (guests). */
    noticeAcceptedAt?: number;
}

/** Longest answer to one of the event's own questions. */
const MAX_ANSWER = 1000;
/**
 * Unconfirmed registrations without an account an event holds at most. A
 * script can mint fresh emails and sessions; this cap keeps it from filling the
 * event, and the board clears the lot from the Inscrições tab.
 */
export const MAX_PENDING_GUESTS = 40;

export class DuplicateRegistration extends ConvexError<string> {
    constructor() {
        super("Já existe uma inscrição com este email para este evento.");
    }
}

/** Emails are compared case-insensitively: "Maria@X.pt" and "maria@x.pt" are one person. */
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/** Registrations that hold a place: everything except cancellations. */
export async function activeCount(ctx: MutationCtx, eventId: Id<"events">): Promise<number> {
    const rows = await ctx.db
        .query("registrations")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect();
    return rows.filter((r) => r.status !== "cancelled").length;
}

/**
 * The event's counter is recomputed, never incremented: a counter nudged by +1
 * and -1 drifts after any failed write or manual edit, and the agenda would
 * show places that do not exist.
 */
export async function syncParticipantCount(ctx: MutationCtx, eventId: Id<"events">): Promise<number> {
    const count = await activeCount(ctx, eventId);
    await ctx.db.patch(eventId, { currentParticipants: count });
    return count;
}

/** Why an event is not taking registrations right now, or null when it is. */
export function closedReason(event: Doc<"events">, now: number): string | null {
    if (event.status !== "published") return "Evento não encontrado.";
    if (event.registrationOpen !== true) return "Inscrições encerradas para este evento.";
    const starts = new Date(event.date).getTime();
    if (!Number.isNaN(starts) && starts < now) return "Este evento já decorreu.";
    return null;
}

/**
 * Keeps only answers to questions the event actually asks, and checks the
 * required ones here too: the browser's checks are a convenience, not a gate.
 */
export function cleanAnswers(event: Pick<Doc<"events">, "registrationFields">, answers: CustomData | undefined): CustomData | undefined {
    const kept: CustomData = {};
    for (const field of event.registrationFields ?? []) {
        const raw = answers?.[field.id];
        const value = typeof raw === "string" ? raw.trim() : raw;
        if (value === undefined || value === "") {
            if (field.required) throw new ConvexError(`Preencha “${field.label}”.`);
            continue;
        }
        if (typeof value === "string" && value.length > MAX_ANSWER) {
            throw new ConvexError(`A resposta a “${field.label}” é demasiado longa.`);
        }
        kept[field.id] = value;
    }
    return Object.keys(kept).length ? kept : undefined;
}

function validateInput(input: RegistrationInput) {
    if (!input.name.trim()) throw new ConvexError("O nome é obrigatório.");
    validateMaxLength(input.name, "nome", 200);
    validateMaxLength(input.email, "email", 254);
    if (!validateEmail(input.email)) throw new ConvexError("Formato de email inválido.");
    if (input.phone !== undefined) validateMaxLength(input.phone, "telefone", 40);
}

/** Validates, inserts as pending, enforces capacity and refreshes the counter. */
export async function insertRegistration(ctx: MutationCtx, input: RegistrationInput): Promise<Id<"registrations">> {
    validateInput(input);

    const event = await ctx.db.get(input.eventId);
    if (!event) throw new ConvexError("Evento não encontrado.");
    const reason = closedReason(event, Date.now());
    if (reason) throw new ConvexError(reason);

    const email = normalizeEmail(input.email);
    // Any active row counts: after a cancellation the oldest row is the cancelled one
    const sameEmail = await ctx.db
        .query("registrations")
        .withIndex("by_event_email", (q) => q.eq("eventId", input.eventId).eq("email", email))
        .collect();
    if (sameEmail.some((r) => r.status !== "cancelled")) throw new DuplicateRegistration();

    if (!input.userId) {
        const rows = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", input.eventId))
            .collect();
        if (rows.filter((r) => r.status === "pending" && !r.userId).length >= MAX_PENDING_GUESTS) {
            throw new ConvexError("Há muitos pedidos por confirmar neste evento. Tente mais tarde ou contacte a organização.");
        }
    }

    if (event.maxParticipants && (await activeCount(ctx, input.eventId)) >= event.maxParticipants) {
        throw new ConvexError("Vagas esgotadas para este evento.");
    }

    const id = await ctx.db.insert("registrations", {
        eventId: input.eventId,
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || undefined,
        customData: cleanAnswers(event, input.customData),
        userId: input.userId,
        noticeAcceptedAt: input.noticeAcceptedAt,
        status: "pending",
        timestamp: Date.now(),
    });

    // A concurrent registration may have taken the last place between the count
    // and the insert; the mutation is transactional, so throwing undoes this one
    const count = await syncParticipantCount(ctx, input.eventId);
    if (event.maxParticipants && count > event.maxParticipants) {
        throw new ConvexError("Vagas esgotadas para este evento.");
    }
    return id;
}
