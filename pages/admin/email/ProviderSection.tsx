import React from 'react';
import { CheckCircle2, ExternalLink, Mail, Server, ShieldCheck } from 'lucide-react';
import { Field } from '../components/Field';
import { AdminSelect } from '../components/AdminSelect';
import { STD_INPUT_CLASS } from '../constants';
import { cn } from '../../../utils/cn';
import { SecretField } from './SecretField';
import { GRAPH_STEPS, PROVIDER_CARDS, SMTP_PRESETS } from './emailCopy';
import type { EmailAdmin, EmailForm, SecretKey } from './useEmailSettingsForm';

interface ProviderSectionProps {
    form: EmailForm;
    data: EmailAdmin;
    update: <K extends keyof EmailForm>(key: K, value: EmailForm[K]) => void;
    setSecret: (key: SecretKey, value: string | undefined) => void;
}

const KEY_FOR: Partial<Record<EmailForm['provider'], { key: SecretKey; stored: keyof EmailAdmin; label: string; placeholder: string }>> = {
    resend: { key: 'resendApiKey', stored: 'hasResendApiKey', label: 'Chave de API do Resend', placeholder: 're_…' },
    brevo: { key: 'brevoApiKey', stored: 'hasBrevoApiKey', label: 'Chave de API do Brevo', placeholder: 'xkeysib-…' },
    postmark: { key: 'postmarkToken', stored: 'hasPostmarkToken', label: 'Server API token do Postmark', placeholder: '00000000-0000-…' },
};

const SmtpFields: React.FC<ProviderSectionProps> = ({ form, data, update, setSecret }) => {
    const applyPreset = (label: string) => {
        const preset = SMTP_PRESETS.find(p => p.label === label);
        if (!preset) return;
        update('smtpHost', preset.host);
        update('smtpPort', String(preset.port));
        update('smtpSecurity', preset.security);
    };
    const preset = SMTP_PRESETS.find(p => p.host === form.smtpHost);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Predefinições SMTP">
                {SMTP_PRESETS.map(p => (
                    <button key={p.label} type="button" onClick={() => applyPreset(p.label)} aria-pressed={preset?.label === p.label}
                        className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                            preset?.label === p.label ? 'border-brand-500/50 bg-brand-500/15 text-white' : 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white')}>
                        {p.label}
                    </button>
                ))}
            </div>
            {preset && <p className="rounded-lg bg-sky-500/10 p-3 text-xs leading-relaxed text-sky-200">{preset.note}</p>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                <Field label="Servidor" className="sm:col-span-3"><input value={form.smtpHost} onChange={e => update('smtpHost', e.target.value)} className={STD_INPUT_CLASS} placeholder="smtp.exemplo.pt" autoComplete="off" spellCheck={false} /></Field>
                <Field label="Porta" className="sm:col-span-1"><input value={form.smtpPort} onChange={e => update('smtpPort', e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={STD_INPUT_CLASS} placeholder={form.smtpSecurity === 'ssl' ? '465' : '587'} /></Field>
                <Field label="Segurança" className="sm:col-span-2">
                    <AdminSelect value={form.smtpSecurity} onChange={e => update('smtpSecurity', e.target.value as EmailForm['smtpSecurity'])}>
                        <option value="ssl">SSL/TLS (porta 465)</option>
                        <option value="starttls">STARTTLS (porta 587)</option>
                    </AdminSelect>
                </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Utilizador" hint="Normalmente, o endereço de email completo."><input value={form.smtpUser} onChange={e => update('smtpUser', e.target.value)} className={STD_INPUT_CLASS} autoComplete="off" spellCheck={false} /></Field>
                <SecretField label="Palavra-passe" stored={data.hasSmtpPassword} fromServer={data.envKeys.smtp} value={form.secrets.smtpPassword} onChange={v => setSecret('smtpPassword', v)} placeholder="Palavra-passe ou palavra-passe de aplicação" />
            </div>
        </div>
    );
};

/** An Entra app with Mail.Send sends as the sender's own Exchange mailbox. */
const GraphFields: React.FC<ProviderSectionProps> = ({ form, data, update, setSecret }) => (
    <div className="space-y-4">
        <details className="group rounded-lg bg-sky-500/10 p-3 text-xs text-sky-100">
            <summary className="flex cursor-pointer items-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><ShieldCheck size={14} aria-hidden="true" /> Como criar a aplicação no Microsoft Entra (5 passos)</summary>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-relaxed">
                {GRAPH_STEPS.map(step => <li key={step}>{step}</li>)}
            </ol>
            <a href="https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-sky-200 hover:text-white">
                Abrir os registos de aplicações <ExternalLink size={12} aria-hidden="true" />
            </a>
        </details>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ID do diretório (inquilino)" hint="Ou o domínio, ex.: associacao.onmicrosoft.com.">
                <input value={form.graphTenantId} onChange={e => update('graphTenantId', e.target.value)} className={cn(STD_INPUT_CLASS, 'font-mono text-sm')} placeholder="00000000-0000-0000-0000-000000000000" autoComplete="off" spellCheck={false} />
            </Field>
            <Field label="ID da aplicação (cliente)">
                <input value={form.graphClientId} onChange={e => update('graphClientId', e.target.value)} className={cn(STD_INPUT_CLASS, 'font-mono text-sm')} placeholder="00000000-0000-0000-0000-000000000000" autoComplete="off" spellCheck={false} />
            </Field>
        </div>
        <SecretField label="Segredo da aplicação (valor)" stored={data.hasGraphClientSecret} fromServer={data.envKeys.graph}
            value={form.secrets.graphClientSecret} onChange={v => setSecret('graphClientSecret', v)} placeholder="Valor do segredo de cliente"
            hint="Os segredos expiram (no máximo 2 anos). Quando expirar, o histórico de envios avisa; crie um novo e cole-o aqui." />
        <p className="text-xs leading-relaxed text-slate-400">
            O email do remetente, mais abaixo, é a caixa de onde os emails saem. Para limitar a aplicação a essa caixa, o administrador do Microsoft 365 pode criar uma política de acesso (RBAC for Applications).
        </p>
    </div>
);

/** Six choices side by side, then only the fields the chosen one needs. */
export const ProviderSection: React.FC<ProviderSectionProps> = props => {
    const { form, data, update, setSecret } = props;
    const card = PROVIDER_CARDS.find(c => c.id === form.provider);
    const key = KEY_FOR[form.provider];
    return (
        <section aria-labelledby="email-provider-title" className="space-y-6 rounded-2xl border border-white/10 bg-dark-surface p-6">
            <div>
                <h3 id="email-provider-title" className="flex items-center gap-2 font-serif text-xl text-white"><Server className="text-sky-400" aria-hidden="true" /> Serviço de envio</h3>
                <p className="mt-1 text-sm text-slate-400">Quem entrega os emails. Todos têm um plano grátis que chega para uma associação.</p>
            </div>
            <div role="radiogroup" aria-labelledby="email-provider-title" className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
                {PROVIDER_CARDS.map(c => {
                    const active = form.provider === c.id;
                    return (
                        <button key={c.id} type="button" role="radio" aria-checked={active} onClick={() => update('provider', c.id)}
                            className={cn('relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all', (c.id === 'none' || c.id === 'smtp') && 'col-span-2 lg:col-span-1', ' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                                active ? 'border-brand-500/60 bg-brand-500/10 shadow-[0_0_0_1px_rgb(var(--brand-500)/0.4)]' : 'border-white/10 bg-black/20 hover:border-white/20')}>
                            {active && <CheckCircle2 size={16} aria-hidden="true" className="absolute right-3 top-3 text-brand-400" />}
                            <span className="flex items-center gap-2 text-sm font-semibold text-white">{c.id === 'smtp' ? <Mail size={15} aria-hidden="true" /> : c.id === 'graph' ? <ShieldCheck size={15} aria-hidden="true" /> : null}{c.name}</span>
                            <span className="text-xs leading-snug text-slate-400">{c.tagline}</span>
                            {c.plan && <span className="mt-auto pt-1 text-[11px] font-semibold text-emerald-300">{c.plan}</span>}
                        </button>
                    );
                })}
            </div>

            {key && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-4">
                    <SecretField label={key.label} stored={Boolean(data[key.stored])} fromServer={data.envKeys[form.provider as 'resend' | 'brevo' | 'postmark']}
                        value={form.secrets[key.key]} onChange={v => setSecret(key.key, v)} placeholder={key.placeholder} hint={card?.keyHelp} />
                    {card?.signupUrl && (
                        <a href={card.signupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200">
                            Criar conta no {card.name} <ExternalLink size={12} aria-hidden="true" />
                        </a>
                    )}
                </div>
            )}
            {form.provider === 'smtp' && <div className="rounded-xl border border-white/10 bg-black/20 p-4"><SmtpFields {...props} /></div>}
            {form.provider === 'graph' && <div className="rounded-xl border border-white/10 bg-black/20 p-4"><GraphFields {...props} /></div>}
            {(form.provider === 'resend' || form.provider === 'brevo' || form.provider === 'postmark') && (
                <p className="text-xs leading-relaxed text-slate-400">
                    O email do remetente tem de ser de um domínio verificado no {card?.name} (registos SPF e DKIM no DNS do domínio). Sem isso, o provedor recusa o envio ou os emails vão para o spam.
                </p>
            )}
        </section>
    );
};
