import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { loadEmailConfig, loadEmailSite, queueEmail, registrationData } from "./queue";
import {
    boardContact, boardRegistration, boardSponsorship, registrationCancelled, registrationConfirmed, registrationReceived,
    type ContactEmailData, type SponsorshipEmailData,
} from "./templates";

/**
 * The moments the platform writes to someone. Each is called from the
 * mutation where the moment happens and is a no-op while email is off.
 */

export type RegistrationMoment = "received" | "confirmed" | "cancelled" | "member_cancelled";

/** Email is a courtesy: whatever goes wrong here, the registration or message is still saved. */
async function safely(work: () => Promise<void>): Promise<void> {
    try {
        await work();
    } catch (error) {
        console.error("Email not queued:", error instanceof Error ? error.message : error);
    }
}

export function notifyRegistration(ctx: MutationCtx, registrationId: Id<"registrations">, moment: RegistrationMoment): Promise<void> {
    return safely(() => queueRegistrationEmails(ctx, registrationId, moment));
}

async function queueRegistrationEmails(ctx: MutationCtx, registrationId: Id<"registrations">, moment: RegistrationMoment): Promise<void> {
    const row = await ctx.db.get(registrationId);
    if (!row) return;
    const event = await ctx.db.get(row.eventId);
    if (!event) return;
    const site = await loadEmailSite(ctx);
    const data = registrationData(row, event, site.siteUrl);
    const related = registrationId as string;

    if (row.email && moment !== "member_cancelled") {
        const email = moment === "received" ? registrationReceived(site, data)
            : moment === "confirmed" ? registrationConfirmed(site, data)
            : registrationCancelled(site, data);
        const kind = moment === "received" ? "registration_received" : moment === "confirmed" ? "registration_confirmed" : "registration_cancelled";
        await queueEmail(ctx, { kind, to: row.email, toName: row.name, email, relatedId: related });
    }

    // The board hears about what it did not do itself: a new sign-up, a member dropping out
    if (moment === "received" || moment === "member_cancelled") {
        const config = await loadEmailConfig(ctx);
        if (!config.boardAddress) return;
        const cancelled = moment === "member_cancelled";
        await queueEmail(ctx, {
            kind: cancelled ? "board_registration_cancelled" : "board_registration",
            to: config.boardAddress,
            email: boardRegistration(site, data, cancelled),
            relatedId: related,
            replyTo: row.email || undefined,
        });
    }
}

export function notifyBoardOfContact(ctx: MutationCtx, id: string, data: ContactEmailData): Promise<void> {
    return safely(async () => {
    const config = await loadEmailConfig(ctx);
    if (!config.boardAddress) return;
    const site = await loadEmailSite(ctx);
    await queueEmail(ctx, { kind: "board_contact", to: config.boardAddress, email: boardContact(site, data), relatedId: id, replyTo: data.email });
    });
}

export function notifyBoardOfSponsorship(ctx: MutationCtx, id: string, data: SponsorshipEmailData): Promise<void> {
    return safely(async () => {
    const config = await loadEmailConfig(ctx);
    if (!config.boardAddress) return;
    const site = await loadEmailSite(ctx);
    await queueEmail(ctx, { kind: "board_sponsorship", to: config.boardAddress, email: boardSponsorship(site, data), relatedId: id, replyTo: data.email });
    });
}
