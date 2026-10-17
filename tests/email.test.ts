import { describe, expect, it } from 'vitest';
import {
    buildHttpRequest, classifyHttpFailure, classifySmtpFailure, formatFrom, messageIdFrom, missingForSending, resolveEmailConfig,
} from '../convex/lib/email/providers';
import { escapeHtml, renderLayout, safeUrl, textOn, type EmailSite } from '../convex/lib/email/layout';
import { boardRegistration, contactReply, registrationConfirmed, registrationReceived } from '../convex/lib/email/templates';
import { calendarLink, formatWhen } from '../convex/lib/email/eventFormat';

const site: EmailSite = { siteName: 'ACR Vila Nova', siteUrl: 'https://exemplo.pt', brandColor: '#b91c1c', contactEmail: 'geral@exemplo.pt', phone: '912 345 678' };
const email = { to: 'ana@exemplo.pt', toName: 'Ana', subject: 'Olá', html: '<p>x</p>', text: 'x', replyTo: 'geral@exemplo.pt' };
const from = { name: 'ACR Vila Nova', address: 'avisos@exemplo.pt' };

describe('email configuration', () => {
    it('takes the backoffice first and the deployment env for what is empty', () => {
        const config = resolveEmailConfig({ provider: 'resend', fromAddress: 'avisos@exemplo.pt' }, { RESEND_API_KEY: 're_env' }, { siteName: 'ACR', contactEmail: 'geral@exemplo.pt' });
        expect(config.apiKey).toBe('re_env');
        expect(config.fromName).toBe('ACR');
        expect(config.replyTo).toBe('geral@exemplo.pt');
        expect(config.boardAddress).toBe('geral@exemplo.pt');
        expect(config.notifyParticipants).toBe(true);
    });

    it('says what is missing before it can send', () => {
        expect(missingForSending(resolveEmailConfig(null, {}, { siteName: 'A' }))).toEqual(['Escolha um provedor']);
        expect(missingForSending(resolveEmailConfig({ provider: 'brevo' }, {}, { siteName: 'A' }))).toEqual(['Email do remetente', 'Chave de API do Brevo']);
        expect(missingForSending(resolveEmailConfig({ provider: 'smtp', fromAddress: 'a@b.pt', smtpHost: 'smtp.gmail.com' }, {}, { siteName: 'A' }))).toEqual(['Palavra-passe SMTP']);
        expect(missingForSending(resolveEmailConfig({ provider: 'postmark', fromAddress: 'a@b.pt', postmarkToken: 't' }, {}, { siteName: 'A' }))).toEqual([]);
    });

    it('defaults the SMTP port to the security mode', () => {
        expect(resolveEmailConfig({ provider: 'smtp', smtpHost: 'h', smtpSecurity: 'starttls' }, {}, { siteName: 'A' }).smtp?.port).toBe(587);
        expect(resolveEmailConfig({ provider: 'smtp', smtpHost: 'h' }, {}, { siteName: 'A' }).smtp?.port).toBe(465);
    });
});

describe('provider requests', () => {
    it('builds each provider’s own payload and auth header', () => {
        const resend = buildHttpRequest('resend', 'key', from, email);
        expect(resend.headers.Authorization).toBe('Bearer key');
        expect(JSON.parse(resend.body)).toMatchObject({ from: '"ACR Vila Nova" <avisos@exemplo.pt>', to: ['ana@exemplo.pt'], reply_to: 'geral@exemplo.pt' });

        const brevo = buildHttpRequest('brevo', 'key', from, email);
        expect(brevo.headers['api-key']).toBe('key');
        expect(JSON.parse(brevo.body)).toMatchObject({ sender: { email: 'avisos@exemplo.pt' }, to: [{ email: 'ana@exemplo.pt', name: 'Ana' }], replyTo: { email: 'geral@exemplo.pt' } });

        const postmark = buildHttpRequest('postmark', 'key', from, email);
        expect(postmark.headers['X-Postmark-Server-Token']).toBe('key');
        expect(JSON.parse(postmark.body)).toMatchObject({ To: 'ana@exemplo.pt', MessageStream: 'outbound', ReplyTo: 'geral@exemplo.pt' });
    });

    it('keeps a sender name from breaking the From header', () => {
        expect(formatFrom('Clube "A" <x>', 'a@b.pt')).toBe('"Clube A x" <a@b.pt>');
        expect(formatFrom('', 'a@b.pt')).toBe('a@b.pt');
    });

    it('reads each provider’s message id', () => {
        expect(messageIdFrom('resend', { id: 'r1' })).toBe('r1');
        expect(messageIdFrom('brevo', { messageId: '<b1>' })).toBe('<b1>');
        expect(messageIdFrom('postmark', { MessageID: 'p1' })).toBe('p1');
    });

    it('names failures and retries only the passing ones', () => {
        expect(classifyHttpFailure(401, 'Invalid key')).toMatchObject({ retryable: false });
        expect(classifyHttpFailure(422, 'The domain is not verified').message).toMatch(/domínio/);
        expect(classifyHttpFailure(429, '').retryable).toBe(true);
        expect(classifyHttpFailure(503, '').retryable).toBe(true);
        expect(classifySmtpFailure({ code: 'EAUTH' }).message).toMatch(/palavra-passe de aplicação/);
        expect(classifySmtpFailure({ code: 'ETIMEDOUT' }).retryable).toBe(true);
    });
});

describe('email content', () => {
    it('escapes everything a visitor typed', () => {
        const html = registrationReceived(site, { name: '<script>alert(1)</script>', eventTitle: 'Torneio & Festa', when: 'Sábado' }).html;
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
        expect(html).toContain('Torneio &amp; Festa');
        expect(escapeHtml(`"'`)).toBe('&quot;&#39;');
    });

    it('drops links that are not http(s)', () => {
        expect(safeUrl('javascript:alert(1)')).toBeUndefined();
        expect(safeUrl('https://exemplo.pt/x')).toBe('https://exemplo.pt/x');
        const html = renderLayout(site, { preheader: 'p', title: 't', paragraphs: [], reason: 'r', cta: { label: 'x', url: 'javascript:alert(1)' } });
        expect(html).not.toContain('javascript:');
    });

    it('links to the event and the calendar on the confirmation', () => {
        const confirmed = registrationConfirmed(site, { name: 'Ana', eventTitle: 'Magusto', when: 'Sábado', eventPath: '/events/magusto', calendarUrl: 'https://calendar.google.com/x' });
        expect(confirmed.subject).toBe('Inscrição confirmada: Magusto');
        expect(confirmed.html).toContain('https://exemplo.pt/events/magusto');
        expect(confirmed.text).toContain('Guardar no calendário: https://calendar.google.com/x');
    });

    it('tells the board who registered and from where', () => {
        const alert = boardRegistration(site, { name: 'Rui', email: 'rui@x.pt', eventTitle: 'Sueca', when: 'Sábado', team: 'Os Ases · Rui, Zé', guest: true });
        expect(alert.subject).toBe('Nova inscrição: Rui em Sueca');
        expect(alert.text).toContain('Equipa: Os Ases · Rui, Zé');
        expect(alert.text).toContain('sem conta');
    });

    it('quotes the original message under a reply', () => {
        const reply = contactReply(site, { name: 'Ana', subject: 'Sala', original: 'Posso alugar?', reply: 'Sim, ligue-nos.', signature: '— ACR' });
        expect(reply.subject).toBe('Re: Sala');
        expect(reply.text).toContain('> Posso alugar?');
    });

    it('picks readable button text for the brand colour', () => {
        expect(textOn('#b91c1c')).toBe('#ffffff');
        expect(textOn('#fbbf24')).toBe('#111111');
        expect(textOn('nope')).toBe('#ffffff');
    });
});

describe('event dates in emails', () => {
    it('reads the date at the venue’s clock', () => {
        expect(formatWhen('2026-07-04T21:30')).toBe('Sábado, 4 de julho às 21:30');
        expect(formatWhen('2026-12-05')).toBe('Sábado, 5 de dezembro');
        expect(calendarLink({ title: 'Festa', date: '2026-07-04T21:30' })).toContain('dates=20260704T203000Z%2F20260704T223000Z');
    });
});

describe('header safety', () => {
    it('keeps visitor text from adding mail headers', async () => {
        const { headerSafe } = await import('../convex/lib/email/queue');
        expect(headerSafe('Joana\r\nBcc: todos@x.pt')).toBe('Joana Bcc: todos@x.pt');
        expect(headerSafe('a'.repeat(300)).length).toBe(200);
    });
});
