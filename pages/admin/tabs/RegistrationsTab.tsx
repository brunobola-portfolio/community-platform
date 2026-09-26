import React, { useMemo, useState } from 'react';
import { Check, ClipboardCheck, Copy, Download, Printer, UserX, X } from 'lucide-react';
import { Badge, Button } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import { AdminSelect } from '../components/AdminSelect';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { downloadCsv, registrationsCsv, csvFileName } from '../../../utils/registrationsCsv';
import { doorListHtml, printDoorList } from '../../../utils/doorList';
import { formatEventDate } from '../../../utils/share';
import { progressWidthClass } from '../../../utils/text';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import type { ActionResult, Event, Registration, RegistrationStatus } from '../../../types';

type Row = Registration & { eventTitle: string };

interface RegistrationsTabProps {
    events: Event[];
    registrations: Registration[];
    onView: (registration: Registration) => void;
    onSetStatus: (id: string, status: RegistrationStatus) => Promise<ActionResult>;
    onBulkStatus: (ids: string[], status: RegistrationStatus) => Promise<ActionResult>;
    onRemove: (id: string) => Promise<ActionResult>;
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ALL = 'all';

const STATUS: Record<RegistrationStatus, { label: string; className: string }> = {
    pending: { label: 'Pendente', className: 'border-amber-500/20 bg-amber-500/10 text-amber-300' },
    confirmed: { label: 'Confirmada', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' },
    cancelled: { label: 'Cancelada', className: 'border-red-500/20 bg-red-500/10 text-red-400' },
};

const FILTERS: ListFilter<Row>[] = [
    { key: 'all', label: 'Todas', predicate: () => true },
    { key: 'pending', label: 'Por confirmar', predicate: r => r.status === 'pending' },
    { key: 'confirmed', label: 'Confirmadas', predicate: r => r.status === 'confirmed' },
    { key: 'cancelled', label: 'Canceladas', predicate: r => r.status === 'cancelled' },
];

const SORTS: ListSort<Row>[] = [
    { key: 'recent', label: 'Mais recentes', compare: (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0) },
    { key: 'oldest', label: 'Por ordem de chegada', compare: (a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0) },
    { key: 'name', label: 'Nome A–Z', compare: (a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt') },
];

/** The event the board is most likely handling now: the next one taking registrations. */
function defaultEvent(events: Event[], registrations: Registration[]): string {
    const now = Date.now();
    const open = events
        .filter(e => e.registrationOpen && new Date(e.date).getTime() >= now)
        .sort((a, b) => a.date.localeCompare(b.date));
    if (open[0]) return open[0].id;
    const withRegistrations = events.find(e => registrations.some(r => r.eventId === e.id));
    return withRegistrations?.id ?? ALL;
}

const Stat: React.FC<{ label: string; value: React.ReactNode; tone?: string }> = ({ label, value, tone = 'text-white' }) => (
    <div className="min-w-[88px]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
);

/**
 * Everything the board does after an event is published with registrations:
 * see who is coming, confirm, cancel, and take the list to the door.
 */
export const RegistrationsTab: React.FC<RegistrationsTabProps> = ({ events, registrations, onView, onSetStatus, onBulkStatus, onRemove, notify }) => {
    const [eventId, setEventId] = useState(() => defaultEvent(events, registrations));
    const [busy, setBusy] = useState(false);
    const [toRemove, setToRemove] = useState<Row | null>(null);

    const titles = useMemo(() => new Map(events.map(e => [e.id, e.title])), [events]);
    const event = events.find(e => e.id === eventId);
    const pickable = useMemo(() => events
        .filter(e => e.registrationOpen || registrations.some(r => r.eventId === e.id))
        .sort((a, b) => b.date.localeCompare(a.date)), [events, registrations]);

    const rows: Row[] = useMemo(() => registrations
        .filter(r => eventId === ALL || r.eventId === eventId)
        .map(r => ({ ...r, eventTitle: titles.get(r.eventId) ?? 'Evento apagado' })), [registrations, eventId, titles]);

    const counts = useMemo(() => ({
        pending: rows.filter(r => r.status === 'pending').length,
        confirmed: rows.filter(r => r.status === 'confirmed').length,
        cancelled: rows.filter(r => r.status === 'cancelled').length,
    }), [rows]);
    const active = counts.pending + counts.confirmed;
    const capacity = event?.maxParticipants;
    const percent = capacity ? Math.min(100, Math.round((active / capacity) * 100)) : 0;

    const run = async (work: () => Promise<ActionResult>, done: string) => {
        setBusy(true);
        try {
            const result = await work();
            if (result.success) notify(done);
            else notify('error' in result ? result.error : 'Não foi possível atualizar.', 'error');
        } finally {
            setBusy(false);
        }
    };

    const confirmPending = () => {
        const ids = rows.filter(r => r.status === 'pending').map(r => r.id);
        if (ids.length) void run(() => onBulkStatus(ids, 'confirmed'), `${ids.length} ${ids.length === 1 ? 'inscrição confirmada' : 'inscrições confirmadas'}.`);
    };

    // Who is actually coming: cancellations stay in the tab, not on the list for the door
    const attending = useMemo(() => rows
        .filter(r => r.status !== 'cancelled')
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt')), [rows]);

    const exportList = () => {
        const fields = event?.registrationFields?.map(f => ({ id: f.id, label: f.label })) ?? [];
        const ordered = attending;
        downloadCsv(registrationsCsv(ordered, fields, eventId === ALL), csvFileName(event?.slug));
        notify('Lista exportada. Abre no Excel ou no Google Sheets.', 'info');
    };

    const printList = () => {
        if (!event) return;
        const fields = event.registrationFields ?? [];
        const html = doorListHtml(event.title, `${formatEventDate(event.date)} · ${event.location}`, fields.map(f => f.label),
            attending.map(r => ({ name: r.name, phone: r.phone, status: r.status, answers: fields.map(f => String(r.customData?.[f.id] ?? '')) })));
        if (!printDoorList(html)) notify('O browser bloqueou a janela de impressão. Permita janelas para este site e tente de novo.', 'error');
    };

    const copyEmails = async () => {
        const emails = [...new Set(rows.filter(r => r.status !== 'cancelled').map(r => r.email).filter(Boolean))].join('; ');
        try {
            await navigator.clipboard.writeText(emails);
            notify('Emails copiados. Cole-os no campo Bcc de um email.', 'info');
        } catch {
            window.prompt('Copie os emails:', emails);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="w-full max-w-md">
                        <label htmlFor="registrations-event" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-400">Evento</label>
                        <AdminSelect id="registrations-event" value={eventId} onChange={e => setEventId(e.target.value)}>
                            <option value={ALL}>Todos os eventos</option>
                            {pickable.map(e => (
                                <option key={e.id} value={e.id}>{new Date(e.date).toLocaleDateString('pt-PT')} · {e.title}</option>
                            ))}
                        </AdminSelect>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={confirmPending} disabled={busy || counts.pending === 0} className="bg-emerald-600 hover:bg-emerald-500">
                            <Check size={16} /> Confirmar pendentes{counts.pending ? ` (${counts.pending})` : ''}
                        </Button>
                        <Button variant="outline" onClick={printList} disabled={!event || attending.length === 0} title={event ? undefined : 'Escolha um evento'}>
                            <Printer size={16} /> Lista para a porta
                        </Button>
                        <Button variant="outline" onClick={exportList} disabled={attending.length === 0}>
                            <Download size={16} /> Exportar (Excel)
                        </Button>
                        <Button variant="outline" onClick={copyEmails} disabled={active === 0}>
                            <Copy size={16} /> Copiar emails
                        </Button>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-end gap-6 border-t border-white/10 pt-5">
                    <Stat label="Por confirmar" value={counts.pending} tone={counts.pending ? 'text-amber-300' : 'text-white'} />
                    <Stat label="Confirmadas" value={counts.confirmed} tone="text-emerald-400" />
                    <Stat label="Canceladas" value={counts.cancelled} tone="text-slate-400" />
                    {capacity ? (
                        <div className="min-w-[220px] flex-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <span>Lotação</span><span className="tabular-nums">{active} / {capacity}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Lotação">
                                <div className={`h-full rounded-full ${percent >= 100 ? 'bg-red-500' : percent > 85 ? 'bg-amber-400' : 'bg-emerald-500'} ${progressWidthClass(percent)}`} />
                            </div>
                            <p className="mt-1.5 text-xs text-slate-400">{capacity - active > 0 ? `${capacity - active} lugares livres` : 'Esgotado — novas inscrições são recusadas'}</p>
                        </div>
                    ) : event ? (
                        <p className="text-xs text-slate-400">Sem limite de lugares neste evento.</p>
                    ) : null}
                </div>
                {event && !event.registrationOpen && (
                    <p className="mt-4 rounded-lg bg-white/5 p-3 text-xs text-slate-400">As inscrições deste evento estão fechadas. Abra-as no evento para voltar a receber.</p>
                )}
            </div>

            <EntityList<Row>
                items={rows}
                getKey={r => r.id}
                getTitle={r => r.name ?? 'Sem nome'}
                getSubtitle={r => [r.email, eventId === ALL ? r.eventTitle : undefined].filter(Boolean).join(' · ')}
                getStatus={r => <Badge className={STATUS[r.status].className}>{STATUS[r.status].label}</Badge>}
                search={r => `${r.name ?? ''} ${r.email ?? ''} ${r.phone ?? ''} ${r.eventTitle} ${Object.values(r.customData ?? {}).join(' ')}`}
                filters={FILTERS}
                sorts={SORTS}
                searchPlaceholder="Pesquisar por nome, email, telemóvel ou equipa"
                noun={['inscrição', 'inscrições']}
                columns={[
                    { header: 'Participante', cell: r => <div><div className="font-medium text-white">{r.name}</div><div className="text-xs text-slate-400">{r.email}</div></div> },
                    ...(eventId === ALL ? [{ header: 'Evento', cell: (r: Row) => <span className="line-clamp-1 max-w-[220px] text-slate-300">{r.eventTitle}</span> }] : []),
                    { header: 'Telemóvel', cell: r => <span className="tabular-nums text-slate-400">{r.phone || '—'}</span> },
                    { header: 'Inscrito em', cell: r => <span className="tabular-nums text-slate-400">{r.timestamp ? new Date(r.timestamp).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</span> },
                    { header: 'Estado', cell: r => <Badge className={STATUS[r.status].className}>{STATUS[r.status].label}</Badge> },
                ]}
                extraActions={r => (
                    <>
                        {/* Words, not icons: cancel sat next to delete and the two were easy to confuse */}
                        {r.status !== 'confirmed' && (
                            <Button size="sm" variant="ghost" aria-label={`Confirmar a inscrição de ${r.name}`} disabled={busy} className="text-emerald-400 hover:text-emerald-300" onClick={() => void run(() => onSetStatus(r.id, 'confirmed'), 'Inscrição confirmada.')}>
                                <Check size={16} /> {r.status === 'cancelled' ? 'Reativar' : 'Confirmar'}
                            </Button>
                        )}
                        {r.status !== 'cancelled' && (
                            <Button size="sm" variant="ghost" aria-label={`Cancelar a inscrição de ${r.name}`} disabled={busy} className="text-amber-300 hover:text-amber-200" onClick={() => void run(() => onSetStatus(r.id, 'cancelled'), 'Inscrição cancelada; o lugar ficou livre.')}>
                                <X size={16} /> Cancelar
                            </Button>
                        )}
                    </>
                )}
                onEdit={r => onView(r)}
                editLabel="Ver"

                onDelete={r => setToRemove(r)}
                emptyIcon={eventId === ALL ? ClipboardCheck : UserX}
                emptyTitle={eventId === ALL ? 'Ainda não há inscrições' : 'Ninguém se inscreveu ainda'}
                emptyDescription={eventId === ALL
                    ? 'Abra as inscrições num evento (Eventos → editar → Inscrições Abertas) e partilhe-o no WhatsApp.'
                    : 'Partilhe o evento no WhatsApp ou no Facebook a partir do site: as inscrições aparecem aqui assim que chegarem.'}
            />

            {toRemove && (
                <DeleteConfirmDialog
                    deleteConfirm={{ type: 'registration', id: toRemove.id, title: `a inscrição de ${toRemove.name}` }}
                    isDeleting={busy}
                    onCancel={() => setToRemove(null)}
                    onConfirm={() => { const id = toRemove.id; setToRemove(null); void run(() => onRemove(id), 'Inscrição apagada.'); }}
                />
            )}
        </div>
    );
};
