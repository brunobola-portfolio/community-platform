import type { EmailProviderId, SmtpSecurity } from '../../../convex/lib/email/providers';

/** The words and presets of Admin > Email, kept apart from the layout. */

export interface ProviderCard {
    id: EmailProviderId;
    name: string;
    tagline: string;
    /** The free plan in one line, checked 2026-10. */
    plan?: string;
    signupUrl?: string;
    /** Where the key is created, in the provider's own words. */
    keyHelp?: string;
}

export const PROVIDER_CARDS: ProviderCard[] = [
    { id: 'none', name: 'Desligado', tagline: 'O site não envia emails. As inscrições e as mensagens continuam a chegar ao backoffice.' },
    {
        id: 'brevo', name: 'Brevo', tagline: 'Europeu (França), interface em português.', plan: '300 emails por dia grátis',
        signupUrl: 'https://www.brevo.com/', keyHelp: 'No Brevo: menu da conta › SMTP & API › API Keys › Generate a new API key.',
    },
    {
        id: 'resend', name: 'Resend', tagline: 'Simples e rápido de configurar.', plan: '3000 emails por mês grátis (até 100 por dia)',
        signupUrl: 'https://resend.com/', keyHelp: 'No Resend: API Keys › Create API Key, com permissão «Sending access».',
    },
    {
        id: 'postmark', name: 'Postmark', tagline: 'Feito para emails de serviço, com ótima entrega.', plan: '100 emails por mês grátis',
        signupUrl: 'https://postmarkapp.com/', keyHelp: 'No Postmark: Servers › o seu servidor › API Tokens › Server API token.',
    },
    {
        id: 'graph', name: 'Microsoft 365', tagline: 'Envia da caixa da associação no Exchange Online, sem SMTP.', plan: 'Incluído na licença Microsoft 365',
        signupUrl: 'https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    },
    { id: 'smtp', name: 'SMTP', tagline: 'Gmail, Outlook.com ou o email do seu alojamento.', plan: 'Usa a conta de email que já tem' },
];

/** The Entra app registration, step by step, as the portal names things today. */
export const GRAPH_STEPS = [
    'Em entra.microsoft.com › Aplicações › Registos de aplicações, carregue em «Novo registo» (conta só desta organização).',
    'Copie o «ID da aplicação (cliente)» e o «ID do diretório (inquilino)» da página Visão geral.',
    'Em «Permissões de API» › Adicionar › Microsoft Graph › Permissões de aplicação, escolha Mail.Send e carregue em «Conceder consentimento de administrador».',
    'Em «Certificados e segredos» › Novo segredo de cliente, copie o Valor (só aparece uma vez). Anote a data de expiração.',
    'O email do remetente tem de ser uma caixa da organização (pode ser uma caixa partilhada, sem licença).',
];

export interface SmtpPreset {
    label: string;
    host: string;
    port: number;
    security: SmtpSecurity;
    note: string;
}

export const SMTP_PRESETS: SmtpPreset[] = [
    { label: 'Gmail', host: 'smtp.gmail.com', port: 465, security: 'ssl', note: 'Precisa da verificação em dois passos e de uma palavra-passe de aplicação (myaccount.google.com › Segurança › Palavras-passe de aplicações). Limite de cerca de 500 emails por dia.' },
    { label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, security: 'starttls', note: 'A conta tem de ter o «SMTP autenticado» ligado no Microsoft 365.' },
    { label: 'Alojamento (cPanel)', host: 'mail.o-seu-dominio.pt', port: 465, security: 'ssl', note: 'Troque pelo servidor que o seu alojamento indica; o utilizador é o endereço de email completo.' },
];

export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    queued: { label: 'Na fila', className: 'border-sky-500/20 bg-sky-500/10 text-sky-300' },
    sending: { label: 'A enviar', className: 'border-sky-500/20 bg-sky-500/10 text-sky-300' },
    sent: { label: 'Enviado', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' },
    failed: { label: 'Falhou', className: 'border-red-500/20 bg-red-500/10 text-red-400' },
    skipped: { label: 'Não enviado', className: 'border-amber-500/20 bg-amber-500/10 text-amber-300' },
};
