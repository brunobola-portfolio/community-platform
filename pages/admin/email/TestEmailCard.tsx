import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { CheckCircle2, FlaskConical, Loader2, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';
import { STD_INPUT_CLASS } from '../constants';
import { cn } from '../../../utils/cn';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface TestEmailCardProps {
    defaultTo: string;
    /** Unsaved changes: the test uses what is saved. */
    dirty: boolean;
}

/**
 * Sends a real email and follows it live through the delivery log, so the
 * board sees "sent" or the provider's reason without leaving the page.
 */
export const TestEmailCard: React.FC<TestEmailCardProps> = ({ defaultTo, dirty }) => {
    const sendTest = useMutation(api.email.sendTest);
    const [to, setTo] = useState(defaultTo);
    const [logId, setLogId] = useState<Id<'emailLogs'> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const log = useQuery(api.email.getLog, logId ? { id: logId } : 'skip');
    // The account's email can arrive after the first render; fill it unless something was typed
    useEffect(() => { if (defaultTo) setTo(current => current || defaultTo); }, [defaultTo]);

    const send = async () => {
        setBusy(true);
        setError(null);
        setLogId(null);
        try {
            setLogId(await sendTest({ to }));
        } catch (e) {
            setError(e instanceof ConvexError && typeof e.data === 'string' ? e.data : 'Não foi possível enviar o teste.');
        } finally {
            setBusy(false);
        }
    };

    const pending = log && (log.status === 'queued' || log.status === 'sending');
    const ok = log?.status === 'sent';
    const failed = log && (log.status === 'failed' || log.status === 'skipped');

    return (
        <section aria-labelledby="email-test-title" className="space-y-4 rounded-2xl border border-white/10 bg-dark-surface p-6">
            <div>
                <h3 id="email-test-title" className="flex items-center gap-2 font-serif text-xl text-white"><FlaskConical className="text-violet-400" aria-hidden="true" /> Enviar um email de teste</h3>
                <p className="mt-1 text-sm text-slate-400">Confirma que o serviço, a chave e o remetente funcionam. Usa as definições guardadas.</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); void send(); }} className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor="email-test-to" className="sr-only">Enviar para</label>
                <input id="email-test-to" type="email" required value={to} onChange={e => setTo(e.target.value)} className={cn(STD_INPUT_CLASS, 'sm:flex-1')} placeholder="o-seu-email@exemplo.pt" />
                <Button type="submit" disabled={busy || Boolean(pending) || !to.trim()} className="whitespace-nowrap sm:min-w-[150px]">
                    {busy || pending ? <Loader2 size={16} className="animate-spin" /> : 'Enviar teste'}
                </Button>
            </form>
            {dirty && <p className="text-xs text-amber-300">Guarde primeiro: o teste usa as definições guardadas.</p>}
            <div aria-live="polite">
                {pending && <p className="flex items-center gap-2 text-sm text-sky-300"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> A enviar para {log?.to}…</p>}
                {pending && log?.error && <p className="mt-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-200">{log.error}</p>}
                {ok && (
                    <p className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>Enviado para {log?.to}. Veja a caixa de entrada; se não aparecer em 2 minutos, procure no spam.</span>
                    </p>
                )}
                {(failed || error) && (
                    <p className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">
                        <XCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{error ?? log?.error ?? 'O envio falhou.'}</span>
                    </p>
                )}
            </div>
        </section>
    );
};
