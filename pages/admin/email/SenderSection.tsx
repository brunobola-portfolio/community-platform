import React, { useState } from 'react';
import { BellRing, Eye, Send, Users } from 'lucide-react';
import { TemplatePreviewModal, type TemplateKind } from './EmailPreviewModal';
import { Field } from '../components/Field';
import { STD_INPUT_CLASS } from '../constants';
import { cn } from '../../../utils/cn';
import type { EmailAdmin, EmailForm } from './useEmailSettingsForm';

interface SenderSectionProps {
    form: EmailForm;
    data: EmailAdmin;
    update: <K extends keyof EmailForm>(key: K, value: EmailForm[K]) => void;
}

interface EmailItem { label: string; kind?: TemplateKind }

interface SwitchRowProps {
    icon: React.ElementType;
    title: string;
    items: EmailItem[];
    checked: boolean;
    onChange: (value: boolean) => void;
    onPreview: (item: EmailItem) => void;
}

const SwitchRow: React.FC<SwitchRowProps> = ({ icon: Icon, title, items, checked, onChange, onPreview }) => (
    <div className={cn('flex gap-4 rounded-xl border p-4 transition-colors', checked ? 'border-brand-500/30 bg-brand-500/5' : 'border-white/10 bg-black/20')}>
        <Icon size={20} aria-hidden="true" className={cn('mt-0.5 shrink-0', checked ? 'text-brand-300' : 'text-slate-500')} />
        <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white">{title}</div>
            <ul className="mt-1.5 space-y-1 text-xs text-slate-400">
                {items.map(item => (
                    <li key={item.label} className="flex flex-wrap items-center gap-x-2">
                        <span aria-hidden="true">·</span>{item.label}
                        {item.kind && (
                            <button type="button" onClick={() => onPreview(item)} className="inline-flex items-center gap-1 rounded font-semibold text-brand-300 hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                <Eye size={12} aria-hidden="true" /> Ver exemplo
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
        <button type="button" role="switch" aria-checked={checked} aria-label={title} onClick={() => onChange(!checked)}
            className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500', checked ? 'bg-brand-600' : 'bg-slate-700')}>
            <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
        </button>
    </div>
);

/** Who the emails come from, where replies and alerts go, and which ones are sent. */
const PARTICIPANT_ITEMS: EmailItem[] = [
    { label: 'Inscrição recebida, logo depois de se inscrever', kind: 'registration_received' },
    { label: 'Inscrição confirmada, com link para o calendário', kind: 'registration_confirmed' },
    { label: 'Inscrição cancelada pela Direção', kind: 'registration_cancelled' },
];
const BOARD_ITEMS: EmailItem[] = [
    { label: 'Nova inscrição e desistência de um sócio', kind: 'board_registration' },
    { label: 'Mensagem pelo formulário de contacto', kind: 'board_contact' },
    { label: 'Pedido de patrocínio' },
];

export const SenderSection: React.FC<SenderSectionProps> = ({ form, data, update }) => {
    const [preview, setPreview] = useState<EmailItem | null>(null);
    const boardless = form.notifyBoard && !form.boardAddress.trim() && !data.defaults.contactEmail;
    return (
    <section aria-labelledby="email-sender-title" className="space-y-6 rounded-2xl border border-white/10 bg-dark-surface p-6">
        <div>
            <h3 id="email-sender-title" className="flex items-center gap-2 font-serif text-xl text-white"><Send className="text-emerald-400" aria-hidden="true" /> Remetente e avisos</h3>
            <p className="mt-1 text-sm text-slate-400">Como os emails aparecem na caixa de entrada de quem os recebe.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome do remetente" hint={`Vazio usa “${data.defaults.fromName}”.`}>
                <input value={form.fromName} maxLength={100} onChange={e => update('fromName', e.target.value)} className={STD_INPUT_CLASS} placeholder={data.defaults.fromName} />
            </Field>
            <Field label="Email do remetente" hint="De um domínio verificado no provedor, ex.: avisos@a-sua-associacao.pt. No SMTP, o da própria conta.">
                <input type="email" required value={form.fromAddress} maxLength={254} onChange={e => update('fromAddress', e.target.value)} className={STD_INPUT_CLASS} placeholder="avisos@exemplo.pt" autoComplete="off" />
            </Field>
            <Field label="Respostas vão para" hint={data.defaults.contactEmail ? `Vazio usa o email de contacto (${data.defaults.contactEmail}).` : 'Vazio: respostas voltam ao remetente.'}>
                <input type="email" value={form.replyTo} maxLength={254} onChange={e => update('replyTo', e.target.value)} className={STD_INPUT_CLASS} placeholder={data.defaults.contactEmail || 'direcao@exemplo.pt'} />
            </Field>
            <Field label="Avisos da Direção chegam a" hint={data.defaults.contactEmail ? `Vazio usa o email de contacto (${data.defaults.contactEmail}).` : 'Sem endereço, a Direção não recebe avisos.'}>
                <input type="email" value={form.boardAddress} maxLength={254} onChange={e => update('boardAddress', e.target.value)} className={STD_INPUT_CLASS} placeholder={data.defaults.contactEmail || 'direcao@exemplo.pt'} />
            </Field>
        </div>
        <div className="space-y-3">
            <SwitchRow icon={Users} title="Emails a quem se inscreve" checked={form.notifyParticipants} onChange={v => update('notifyParticipants', v)} items={PARTICIPANT_ITEMS} onPreview={setPreview} />
            <SwitchRow icon={BellRing} title="Avisos à Direção" checked={form.notifyBoard} onChange={v => update('notifyBoard', v)} items={BOARD_ITEMS} onPreview={setPreview} />
            {boardless && <p role="alert" className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-200">Os avisos estão ligados mas não há para onde os enviar. Preencha «Avisos da Direção chegam a» ou o email de contacto em Definições.</p>}
        </div>
        {!data.siteUrlConfigured && (
            <p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-200">O servidor não tem o endereço do site (variável SITE_URL), por isso os emails saem sem links para o evento. Peça a quem gere o alojamento para a definir.</p>
        )}
        {preview?.kind && <TemplatePreviewModal kind={preview.kind} label={preview.label} onClose={() => setPreview(null)} />}
    </section>
    );
};
