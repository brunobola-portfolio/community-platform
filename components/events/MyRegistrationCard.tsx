import React, { useState } from 'react';
import { CheckCircle2, Clock, Users } from 'lucide-react';
import { Button } from '../ui/UIComponents';
import { teamSummary } from '../../utils/registrationState';
import { cn } from '../../utils/cn';
import type { MyRegistration } from '../../hooks/useMyRegistrations';

interface MyRegistrationCardProps {
    registration: MyRegistration;
    /** Returns an error message, or null when the registration was cancelled. */
    onCancel: (id: string) => Promise<string | null>;
    /** Hide the cancel action, e.g. once the event has started. */
    canCancel?: boolean;
    compact?: boolean;
}

const STATE = {
    pending: {
        icon: Clock,
        title: 'Inscrição recebida',
        text: 'A organização ainda vai confirmar. O estado muda aqui assim que confirmarem.',
        tone: 'bg-amber-500/10 ring-amber-500/25 text-amber-800 dark:text-amber-300',
    },
    confirmed: {
        icon: CheckCircle2,
        title: 'Inscrição confirmada',
        text: 'Está tudo tratado. Até lá!',
        tone: 'bg-emerald-500/10 ring-emerald-500/25 text-emerald-800 dark:text-emerald-300',
    },
} as const;

/**
 * Tells a member they are already in, and lets them free the place. Before,
 * the event kept offering "Register" and a second try answered "duplicate".
 */
export const MyRegistrationCard: React.FC<MyRegistrationCardProps> = ({ registration, onCancel, canCancel = true, compact = false }) => {
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    if (registration.status === 'cancelled') return null;
    const state = STATE[registration.status];
    const Icon = state.icon;
    const team = registration.teamMembers?.length || registration.teamName ? teamSummary({ name: 'Você', ...registration }) : null;

    const cancel = async () => {
        setBusy(true);
        const message = await onCancel(registration.id);
        setBusy(false);
        setError(message);
        if (!message) setConfirming(false);
    };

    return (
        <div className={cn('rounded-2xl p-4 ring-1', state.tone, compact && 'p-3')}>
            <div className="flex items-start gap-3">
                <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider">{state.title}</div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{state.text}</p>
                    {team && <p className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200"><Users size={14} aria-hidden="true" /> {team}</p>}
                </div>
            </div>
            {canCancel && (
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2" aria-live="polite">
                    {confirming ? (
                        <>
                            <span className="mr-auto text-sm text-slate-700 dark:text-slate-200">Liberta o lugar para outra pessoa.</span>
                            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>Manter</Button>
                            <Button size="sm" onClick={() => void cancel()} disabled={busy} className="bg-red-700 hover:bg-red-800">
                                {busy ? 'A cancelar…' : 'Sim, cancelar'}
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} className="text-slate-700 dark:text-slate-300">Não posso ir</Button>
                    )}
                </div>
            )}
            {error && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
        </div>
    );
};
