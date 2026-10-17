/** The kinds of email the platform sends; shared with the backoffice log. */

export type EmailKind =
    | "registration_received"
    | "registration_confirmed"
    | "registration_cancelled"
    | "board_registration"
    | "board_registration_cancelled"
    | "board_contact"
    | "board_sponsorship"
    | "contact_reply"
    | "test";

/** Who an email is for decides which switch in the backoffice controls it. */
export const PARTICIPANT_KINDS: EmailKind[] = ["registration_received", "registration_confirmed", "registration_cancelled"];
export const BOARD_KINDS: EmailKind[] = ["board_registration", "board_registration_cancelled", "board_contact", "board_sponsorship"];

export const KIND_LABELS: Record<EmailKind, string> = {
    registration_received: "Inscrição recebida",
    registration_confirmed: "Inscrição confirmada",
    registration_cancelled: "Inscrição cancelada",
    board_registration: "Aviso à Direção: nova inscrição",
    board_registration_cancelled: "Aviso à Direção: desistência",
    board_contact: "Aviso à Direção: mensagem",
    board_sponsorship: "Aviso à Direção: patrocínio",
    contact_reply: "Resposta a mensagem",
    test: "Email de teste",
};
