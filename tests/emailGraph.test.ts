import { describe, expect, it } from 'vitest';
import { classifyGraphFailure, graphSendRequest, graphTokenRequest, missingForSending, resolveEmailConfig } from '../convex/lib/email/providers';

const email = { to: 'ana@exemplo.pt', toName: 'Ana', subject: 'Olá', html: '<p>x</p>', text: 'x', replyTo: 'direcao@exemplo.pt' };

describe('Microsoft Graph', () => {
    it('asks Entra for an app-only token', () => {
        const request = graphTokenRequest('associacao.onmicrosoft.com', 'client-id', 's3cr3t&x');
        expect(request.url).toBe('https://login.microsoftonline.com/associacao.onmicrosoft.com/oauth2/v2.0/token');
        const form = new URLSearchParams(request.body);
        expect(form.get('grant_type')).toBe('client_credentials');
        expect(form.get('scope')).toBe('https://graph.microsoft.com/.default');
        expect(form.get('client_secret')).toBe('s3cr3t&x');
    });

    it('sends from the sender’s mailbox without filling Sent Items', () => {
        const request = graphSendRequest('token', 'avisos@exemplo.pt', email);
        expect(request.url).toBe('https://graph.microsoft.com/v1.0/users/avisos%40exemplo.pt/sendMail');
        expect(request.headers.Authorization).toBe('Bearer token');
        const body = JSON.parse(request.body);
        expect(body.saveToSentItems).toBe(false);
        expect(body.message.body).toEqual({ contentType: 'HTML', content: '<p>x</p>' });
        expect(body.message.toRecipients[0].emailAddress).toEqual({ address: 'ana@exemplo.pt', name: 'Ana' });
        expect(body.message.replyTo[0].emailAddress.address).toBe('direcao@exemplo.pt');
    });

    it('names what is wrong in the Entra app or the mailbox', () => {
        expect(classifyGraphFailure('token', 400, 'AADSTS90002: Tenant not found').message).toMatch(/diretório/);
        expect(classifyGraphFailure('token', 400, 'AADSTS700016: Application not found').message).toMatch(/aplicação \(client\)/);
        expect(classifyGraphFailure('token', 401, 'AADSTS7000215: Invalid client secret').message).toMatch(/segredo/);
        expect(classifyGraphFailure('token', 503, '').retryable).toBe(true);
        expect(classifyGraphFailure('send', 403, 'ErrorAccessDenied').message).toMatch(/Mail\.Send/);
        expect(classifyGraphFailure('send', 404, 'ErrorInvalidUser').message).toMatch(/caixa do remetente/);
        expect(classifyGraphFailure('send', 429, '').retryable).toBe(true);
    });

    it('lists the three app details it still needs, and reads them from the env', () => {
        expect(missingForSending(resolveEmailConfig({ provider: 'graph', fromAddress: 'a@b.pt' }, {}, { siteName: 'A' })))
            .toEqual(['ID do diretório (tenant)', 'ID da aplicação (client)', 'Segredo da aplicação']);
        const fromEnv = resolveEmailConfig({ provider: 'graph', fromAddress: 'a@b.pt' }, { MS_GRAPH_TENANT_ID: 't', MS_GRAPH_CLIENT_ID: 'c', MS_GRAPH_CLIENT_SECRET: 's' }, { siteName: 'A' });
        expect(missingForSending(fromEnv)).toEqual([]);
        expect(fromEnv.graph).toEqual({ tenantId: 't', clientId: 'c', clientSecret: 's' });
    });
});
