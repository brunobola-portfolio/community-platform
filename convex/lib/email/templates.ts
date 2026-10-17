import { renderLayout, renderText, type EmailBody, type EmailDetail, type EmailSite } from "./layout";

export type { EmailKind } from "./kinds";

/**
 * Every email the platform sends, as pure functions of the data they need.
 * Rendered when queued, so the delivery log shows exactly what went out.
 */

export interface RegistrationEmailData {
    name: string;
    email?: string;
    phone?: string;
    eventTitle: string;
    /** Already formatted for people, e.g. "sábado, 25 de outubro às 15:00". */
    when: string;
    location?: string;
    team?: string;
    price?: number;
    eventPath?: string;
    calendarUrl?: string;
    answers?: EmailDetail[];
    /** Registered without an account, in the board's alert. */
    guest?: boolean;
}

export interface ContactEmailData { name: string; email: string; subject: string; message: string }
export interface SponsorshipEmailData { name: string; email: string; phone: string; tier: string }
export interface ReplyEmailData { name: string; subject: string; original: string; reply: string; signature: string }

export interface RenderedEmail {
    subject: string;
    html: string;
    text: string;
}

const link = (site: EmailSite, path?: string) => (site.siteUrl && path ? `${site.siteUrl.replace(/\/$/, "")}${path}` : undefined);

function render(site: EmailSite, subject: string, body: EmailBody): RenderedEmail {
    return { subject, html: renderLayout(site, body), text: renderText(site, body) };
}

function eventDetails(d: RegistrationEmailData): EmailDetail[] {
    return [
        { label: "Evento", value: d.eventTitle },
        { label: "Quando", value: d.when },
        ...(d.location ? [{ label: "Onde", value: d.location }] : []),
        ...(d.team ? [{ label: "Equipa", value: d.team }] : []),
        ...(d.price ? [{ label: "Valor", value: `${d.price} €` }] : []),
    ];
}

const contactLine = (site: EmailSite) => [site.phone, site.contactEmail].filter(Boolean).join(" ou ");

export function registrationReceived(site: EmailSite, d: RegistrationEmailData): RenderedEmail {
    const paragraphs = [
        `Olá ${d.name},`,
        `Recebemos a sua inscrição em ${d.eventTitle}. A organização vai confirmá-la e volta a escrever-lhe quando estiver confirmada.`,
    ];
    if (d.price) paragraphs.push(`O pagamento (${d.price} €) combina-se com a organização, no local ou pelos contactos abaixo.`);
    return render(site, `Inscrição recebida: ${d.eventTitle}`, {
        preheader: `Recebemos a sua inscrição. A organização vai confirmá-la em breve.`,
        eyebrow: "Inscrição recebida",
        title: "Está quase. Falta a confirmação.",
        paragraphs,
        details: eventDetails(d),
        cta: link(site, d.eventPath) ? { label: "Ver o evento", url: link(site, d.eventPath) as string } : undefined,
        reason: `Recebeu este email porque se inscreveu num evento da ${site.siteName}. Se não foi você, responda a este email.`,
    });
}

export function registrationConfirmed(site: EmailSite, d: RegistrationEmailData): RenderedEmail {
    const contact = contactLine(site);
    return render(site, `Inscrição confirmada: ${d.eventTitle}`, {
        preheader: `A sua inscrição está confirmada. Até lá!`,
        eyebrow: "Inscrição confirmada",
        title: "Está confirmado. Até lá!",
        paragraphs: [
            `Olá ${d.name},`,
            `A sua inscrição em ${d.eventTitle} está confirmada.`,
            contact ? `Se não puder ir, avise a organização (${contact}) para o lugar ficar para outra pessoa.` : "Se não puder ir, responda a este email para o lugar ficar para outra pessoa.",
        ],
        details: eventDetails(d),
        cta: d.calendarUrl ? { label: "Guardar no calendário", url: d.calendarUrl } : undefined,
        secondaryLink: link(site, d.eventPath) ? { label: "Ver o evento no site", url: link(site, d.eventPath) as string } : undefined,
        reason: `Recebeu este email porque se inscreveu num evento da ${site.siteName}.`,
    });
}

export function registrationCancelled(site: EmailSite, d: RegistrationEmailData): RenderedEmail {
    return render(site, `Inscrição cancelada: ${d.eventTitle}`, {
        preheader: `A sua inscrição foi cancelada.`,
        eyebrow: "Inscrição cancelada",
        title: "A sua inscrição foi cancelada",
        paragraphs: [
            `Olá ${d.name},`,
            `A sua inscrição em ${d.eventTitle} foi cancelada. Se acha que é engano, responda a este email e a organização verifica.`,
        ],
        details: eventDetails(d),
        reason: `Recebeu este email porque se inscreveu num evento da ${site.siteName}.`,
    });
}

export function boardRegistration(site: EmailSite, d: RegistrationEmailData, cancelled = false): RenderedEmail {
    const details: EmailDetail[] = [
        { label: "Nome", value: d.name },
        ...(d.email ? [{ label: "Email", value: d.email }] : []),
        ...(d.phone ? [{ label: "Telemóvel", value: d.phone }] : []),
        ...eventDetails(d),
        ...(d.answers ?? []),
    ];
    return render(site, cancelled ? `Desistência: ${d.name} em ${d.eventTitle}` : `Nova inscrição: ${d.name} em ${d.eventTitle}`, {
        preheader: cancelled ? `${d.name} cancelou a inscrição; o lugar ficou livre.` : `${d.name} inscreveu-se${d.guest ? " sem conta" : ""}. Falta confirmar.`,
        eyebrow: cancelled ? "Desistência" : "Nova inscrição",
        title: cancelled ? `${d.name} já não vai` : `${d.name} inscreveu-se`,
        paragraphs: [cancelled
            ? "Cancelou a inscrição na área de sócio. O lugar ficou livre no site."
            : `A inscrição está por confirmar no separador Inscrições.${d.guest ? " Foi feita sem conta, a partir do site." : ""}`],
        details,
        cta: link(site, "/admin") ? { label: "Abrir Inscrições", url: link(site, "/admin") as string } : undefined,
        reason: `Aviso automático do site da ${site.siteName}. Desligue-o no backoffice, em Email.`,
    });
}

export function boardContact(site: EmailSite, d: ContactEmailData): RenderedEmail {
    return render(site, `Mensagem do site: ${d.subject}`, {
        preheader: `${d.name} escreveu pelo formulário de contacto.`,
        eyebrow: "Mensagem recebida",
        title: d.subject,
        paragraphs: [`${d.name} (${d.email}) escreveu pelo formulário de contacto do site. Pode responder no backoffice, em Mensagens recebidas, ou diretamente a este email.`],
        quote: { label: "Mensagem", text: d.message },
        cta: link(site, "/admin") ? { label: "Abrir Mensagens recebidas", url: link(site, "/admin") as string } : undefined,
        reason: `Aviso automático do site da ${site.siteName}. Desligue-o no backoffice, em Email.`,
    });
}

export function boardSponsorship(site: EmailSite, d: SponsorshipEmailData): RenderedEmail {
    return render(site, `Pedido de patrocínio: ${d.name}`, {
        preheader: `${d.name} quer ser parceiro (${d.tier}).`,
        eyebrow: "Pedido de patrocínio",
        title: `${d.name} quer ser parceiro`,
        paragraphs: ["Chegou um pedido de patrocínio pelo site. Os dados ficam também em Mensagens recebidas."],
        details: [{ label: "Nome", value: d.name }, { label: "Email", value: d.email }, { label: "Telefone", value: d.phone }, { label: "Nível", value: d.tier }],
        cta: link(site, "/admin") ? { label: "Abrir o backoffice", url: link(site, "/admin") as string } : undefined,
        reason: `Aviso automático do site da ${site.siteName}. Desligue-o no backoffice, em Email.`,
    });
}

export function contactReply(site: EmailSite, d: ReplyEmailData): RenderedEmail {
    return render(site, `Re: ${d.subject}`, {
        preheader: d.reply.slice(0, 120),
        eyebrow: `Resposta da ${site.siteName}`,
        // The board writes its own greeting; a second one from the template reads as a form letter
        title: d.subject,
        paragraphs: [d.reply, d.signature],
        quote: { label: "A sua mensagem", text: d.original },
        reason: `Esta é a resposta à mensagem que enviou pelo site da ${site.siteName}. Pode responder diretamente a este email.`,
    });
}

export function testEmail(site: EmailSite, provider: string): RenderedEmail {
    return render(site, `Email de teste · ${site.siteName}`, {
        preheader: "Se está a ler isto, o envio de emails funciona.",
        eyebrow: "Teste",
        title: "O envio de emails está a funcionar",
        paragraphs: [
            `Este email foi enviado pelo backoffice da ${site.siteName} através de ${provider}.`,
            "Se chegou à caixa de entrada (e não ao spam), está tudo pronto. Se foi para o spam, confirme o domínio do remetente no seu provedor (registos SPF e DKIM).",
        ],
        reason: "Email de teste pedido no backoffice.",
    });
}
