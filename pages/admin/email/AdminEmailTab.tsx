import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { AlertTriangle, CheckCircle2, MailCheck, PowerOff } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { PROVIDER_LABELS } from '../../../convex/lib/email/providers';
import { cn } from '../../../utils/cn';
import { SaveBar } from '../components/SaveBar';
import { ProviderSection } from './ProviderSection';
import { SenderSection } from './SenderSection';
import { TestEmailCard } from './TestEmailCard';
import { EmailLogList } from './EmailLogList';
import { useEmailSettingsForm, type EmailAdmin } from './useEmailSettingsForm';

interface AdminEmailTabProps {
    adminEmail?: string;
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DAY = 24 * 60 * 60 * 1000;

/** One glance: is email on, through what, and did yesterday's emails go out. */
const StatusHero: React.FC<{ data: EmailAdmin }> = ({ data }) => {
    const logs = useQuery(api.email.listLogs);
    const recent = useMemo(() => {
        const since = Date.now() - DAY;
        const rows = (logs ?? []).filter(r => r.createdAt >= since);
        return { sent: rows.filter(r => r.status === 'sent').length, problems: rows.filter(r => r.status === 'failed' || r.status === 'skipped').length };
    }, [logs]);
    const off = data.provider === 'none';
    const ready = !off && data.missing.length === 0;
    const Icon = off ? PowerOff : ready ? CheckCircle2 : AlertTriangle;
    return (
        <div className={cn('flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center',
            off ? 'border-white/10 bg-white/5' : ready ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-amber-500/25 bg-amber-500/10')}>
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', off ? 'bg-white/10 text-slate-300' : ready ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300')}>
                <Icon size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">
                    {off ? 'O site não envia emails' : ready ? `Emails ativos através de ${PROVIDER_LABELS[data.provider]}` : `Falta pouco para ligar o ${PROVIDER_LABELS[data.provider]}`}
                </p>
                <p className="mt-0.5 text-sm text-slate-300">
                    {off ? 'Escolha um serviço abaixo para confirmar inscrições e avisar a Direção por email.'
                        : ready ? 'Inscrições, confirmações e avisos seguem por email. Envie um teste para confirmar.'
                        : `Falta: ${data.missing.join(', ')}.`}
                </p>
            </div>
            {!off && (
                <dl className="flex shrink-0 gap-6 border-t border-white/10 pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                    <div><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Enviados 24 h</dt><dd className="text-2xl font-semibold tabular-nums text-white">{recent.sent}</dd></div>
                    <div><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Problemas</dt><dd className={cn('text-2xl font-semibold tabular-nums', recent.problems ? 'text-amber-300' : 'text-white')}>{recent.problems}</dd></div>
                </dl>
            )}
        </div>
    );
};

/**
 * Admin > Email: the service that delivers, who it comes from, what is sent,
 * a live test and the delivery log. Its own table and its own save.
 */
export const AdminEmailTab: React.FC<AdminEmailTabProps> = ({ adminEmail, notify }) => {
    const { data, form, dirty, saving, update, setSecret, submit, discard } = useEmailSettingsForm();
    const [error, setError] = useState<string | null>(null);

    if (data === null) return null;
    if (data === undefined || !form) {
        return <div className="space-y-6" aria-busy="true">{[0, 1, 2].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />)}</div>;
    }

    const save = async () => {
        setError(null);
        const failure = await submit();
        if (failure) { setError(failure); notify(failure, 'error'); }
        else notify('Definições de email guardadas.');
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <StatusHero data={data} />
            <ProviderSection form={form} data={data} update={update} setSecret={setSecret} />
            {form.provider !== 'none' && <SenderSection form={form} data={data} update={update} />}
            {data.provider !== 'none' && <TestEmailCard defaultTo={adminEmail ?? data.defaults.contactEmail} dirty={dirty} />}
            <EmailLogList notify={notify} />
            {error && <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-200"><MailCheck size={16} aria-hidden="true" /> {error}</p>}
            <SaveBar onSave={() => void save()} isSaving={saving} dirty={dirty} onDiscard={discard} />
        </div>
    );
};
