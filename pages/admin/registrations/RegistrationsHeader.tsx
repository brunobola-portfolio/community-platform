import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { Check, Copy, Download, ExternalLink, Lock, LockOpen, Printer, UserPlus } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';
import { AdminSelect } from '../components/AdminSelect';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { progressWidthClass } from '../../../utils/text';
import { eventPath } from '../../../utils/share';
import { isEventUpcoming } from '../../../utils/eventTime';
import { formatDeadline, isDeadlinePassed, placeNoun } from '../../../utils/registrationState';
import { cn } from '../../../utils/cn';
import type { Event } from '../../../types';

export const ALL_EVENTS = 'all';

interface Counts { pending: number; confirmed: number; cancelled: number }

interface RegistrationsHeaderProps {
    events: Event[];
    eventId: string;
    onEventChange: (id: string) => void;
    event: Event | undefined;
    counts: Counts;
    busy: boolean;
    hasAttending: boolean;
    onConfirmPending: () => void;
    onAdd: () => void;
    onPrint: () => void;
    onExport: () => void;
    onCopyEmails: () => void;
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const Stat: React.FC<{ label: string; value: React.ReactNode; tone?: string }> = ({ label, value, tone = 'text-white' }) => (
    <div className="min-w-[88px]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <div className={cn('mt-1 text-2xl font-semibold tabular-nums', tone)}>{value}</div>
    </div>
);

/** One sentence on how the event takes registrations, so nobody has to open the event to know. */
function windowText(event: Event, full: boolean): { text: string; open: boolean } {
    if (!isEventUpcoming(event.date)) return { text: 'O evento já decorreu.', open: false };
    if (!event.registrationOpen) return { text: 'Inscrições fechadas no site. Pode acrescentar inscrições à mão.', open: false };
    if (isDeadlinePassed(event.registrationDeadline)) return { text: `O prazo terminou (${formatDeadline(event.registrationDeadline ?? '')}). Só a Direção acrescenta inscrições.`, open: false };
    if (full) return { text: 'Esgotado: o site já não aceita inscrições. Para abrir vagas, cancele inscrições ou aumente os lugares no evento.', open: false };
    const parts = [
        event.registrationDeadline ? `até ${formatDeadline(event.registrationDeadline)}` : 'até o evento começar',
        (event.teamSize ?? 1) >= 2 ? `por equipas de ${event.teamSize}` : 'individuais',
        event.allowGuestRegistration === false ? 'só sócios com conta' : 'aberto a qualquer pessoa',
    ];
    return { text: `Abertas no site · ${parts.join(' · ')}.`, open: true };
}

const OpenToggle: React.FC<{ event: Event; full: boolean; notify: RegistrationsHeaderProps['notify'] }> = ({ event, full, notify }) => {
    const update = useMutation(api.events.update);
    const [saving, setSaving] = useState(false);
    const state = windowText(event, full);
    const upcoming = isEventUpcoming(event.date);
    const toggle = async () => {
        setSaving(true);
        try {
            await update({ id: event.id as Id<'events'>, registrationOpen: !event.registrationOpen });
            notify(event.registrationOpen ? 'Inscrições fechadas no site.' : 'Inscrições abertas no site.', 'info');
        } catch {
            notify('Não foi possível mudar as inscrições. Tente de novo.', 'error');
        } finally {
            setSaving(false);
        }
    };
    return (
        <div className={cn('flex flex-col gap-3 rounded-xl p-3 text-sm sm:flex-row sm:items-center', state.open ? 'bg-emerald-500/10 text-emerald-200' : 'bg-white/5 text-slate-300')}>
            <span className="flex-1">{state.text}</span>
            <div className="flex shrink-0 gap-2">
                <a href={eventPath(event.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                    <ExternalLink size={14} aria-hidden="true" /> Ver no site
                </a>
                {upcoming && (
                    <Button size="sm" variant="outline" onClick={() => void toggle()} disabled={saving}>
                        {event.registrationOpen ? <><Lock size={14} /> Fechar inscrições</> : <><LockOpen size={14} /> Abrir inscrições</>}
                    </Button>
                )}
            </div>
        </div>
    );
};

export const RegistrationsHeader: React.FC<RegistrationsHeaderProps> = ({
    events, eventId, onEventChange, event, counts, busy, hasAttending, onConfirmPending, onAdd, onPrint, onExport, onCopyEmails, notify,
}) => {
    const active = counts.pending + counts.confirmed;
    const capacity = event?.maxParticipants;
    const percent = capacity ? Math.min(100, Math.round((active / capacity) * 100)) : 0;
    const [one, many] = event ? placeNoun(event) : ['lugar', 'lugares'];
    const left = capacity ? capacity - active : 0;

    return (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="w-full max-w-md">
                    <label htmlFor="registrations-event" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-400">Evento</label>
                    <AdminSelect id="registrations-event" value={eventId} onChange={e => onEventChange(e.target.value)}>
                        <option value={ALL_EVENTS}>Todos os eventos</option>
                        {events.map(e => (
                            <option key={e.id} value={e.id}>{new Date(e.date).toLocaleDateString('pt-PT')} · {e.title}</option>
                        ))}
                    </AdminSelect>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>button]:whitespace-nowrap [&>button]:px-3 [&_svg]:shrink-0">
                    <Button onClick={onConfirmPending} disabled={busy || counts.pending === 0} className="col-span-2 bg-emerald-600 hover:bg-emerald-500">
                        <Check size={16} /> Confirmar pendentes{counts.pending ? ` (${counts.pending})` : ''}
                    </Button>
                    <Button variant="outline" onClick={onAdd} disabled={!event} title={event ? undefined : 'Escolha um evento'}>
                        <UserPlus size={16} /> Adicionar
                    </Button>
                    <Button variant="outline" onClick={onPrint} disabled={!event || !hasAttending} title={event ? undefined : 'Escolha um evento'}>
                        <Printer size={16} /> Lista para a porta
                    </Button>
                    <Button variant="outline" onClick={onExport} disabled={!hasAttending}>
                        <Download size={16} /> Exportar (Excel)
                    </Button>
                    <Button variant="outline" onClick={onCopyEmails} disabled={active === 0}>
                        <Copy size={16} /> Copiar emails
                    </Button>
                </div>
            </div>

            {event && <OpenToggle event={event} full={Boolean(capacity) && left <= 0} notify={notify} />}

            <div className="flex flex-wrap items-end gap-6 border-t border-white/10 pt-5">
                <Stat label="Por confirmar" value={counts.pending} tone={counts.pending ? 'text-amber-300' : 'text-white'} />
                <Stat label="Confirmadas" value={counts.confirmed} tone="text-emerald-400" />
                <Stat label="Canceladas" value={counts.cancelled} tone="text-slate-400" />
                {capacity ? (
                    <div className="min-w-[220px] flex-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <span>Lotação ({many})</span><span className="tabular-nums">{active} / {capacity}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Lotação">
                            <div className={cn('h-full rounded-full', percent >= 100 ? 'bg-red-500' : percent > 85 ? 'bg-amber-400' : 'bg-emerald-500', progressWidthClass(percent))} />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-400">{left > 0 ? `${left} ${left === 1 ? `${one} livre` : `${many} livres`}` : 'Esgotado — o site recusa novas inscrições'}</p>
                    </div>
                ) : event ? (
                    <p className="text-xs text-slate-400">Sem limite de {many} neste evento.</p>
                ) : null}
            </div>
        </div>
    );
};
