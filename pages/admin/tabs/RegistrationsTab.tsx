import React, { useMemo, useState } from 'react';
import { Check, ClipboardCheck, UserX, X } from 'lucide-react';
import { Badge, Button } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { RegistrationsHeader, ALL_EVENTS } from '../registrations/RegistrationsHeader';
import { AddRegistrationModal } from '../registrations/AddRegistrationModal';
import { downloadCsv, registrationsCsv, csvFileName } from '../../../utils/registrationsCsv';
import { doorListHtml, printDoorList } from '../../../utils/doorList';
import { formatEventDate } from '../../../utils/share';
import { isEventUpcoming } from '../../../utils/eventTime';
import { isTeamEvent, teamSummary } from '../../../utils/registrationState';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import type { ActionResult, Event, Registration, RegistrationStatus } from '../../../types';
import { describeActionError } from '../errors';

type Row = Registration & { eventTitle: string; team: string };

interface RegistrationsTabProps {
    events: Event[];
    registrations: Registration[];
    /** Opened from an event's row in Eventos: start on that event. */
    initialEventId?: string;
    onView: (registration: Registration) => void;
    onSetStatus: (id: string, status: RegistrationStatus) => Promise<ActionResult>;
    onBulkStatus: (ids: string[], status: RegistrationStatus) => Promise<ActionResult>;
    onRemove: (id: string) => Promise<ActionResult>;
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const STATUS: Record<RegistrationStatus, { label: string; className: string }> = {
    pending: { label: 'Por confirmar', className: 'border-amber-500/20 bg-amber-500/10 text-amber-300' },
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
    const open = events
        .filter(e => e.registrationOpen && isEventUpcoming(e.date))
        .sort((a, b) => a.date.localeCompare(b.date));
    if (open[0]) return open[0].id;
    const withRegistrations = events.find(e => registrations.some(r => r.eventId === e.id));
    return withRegistrations?.id ?? ALL_EVENTS;
}

const StatusBadge: React.FC<{ row: Row }> = ({ row }) => (
    <span className="inline-flex flex-wrap items-center gap-1.5">
        <Badge className={STATUS[row.status].className}>{STATUS[row.status].label}</Badge>
        {row.addedByAdmin && <Badge className="border-white/10 bg-white/5 text-slate-300" title="Adicionada no backoffice">Direção</Badge>}
    </span>
);

/**
 * Everything the board does after an event is published with registrations:
 * see who is coming, confirm, cancel, write down a phone call, and take the
 * list to the door.
 */
export const RegistrationsTab: React.FC<RegistrationsTabProps> = ({ events, registrations, initialEventId, onView, onSetStatus, onBulkStatus, onRemove, notify }) => {
    const [eventId, setEventId] = useState(() => (initialEventId && events.some(e => e.id === initialEventId) ? initialEventId : defaultEvent(events, registrations)));
    const [busy, setBusy] = useState(false);
    const [toRemove, setToRemove] = useState<Row | null>(null);
    const [adding, setAdding] = useState(false);

    const titles = useMemo(() => new Map(events.map(e => [e.id, e.title])), [events]);
    const event = events.find(e => e.id === eventId);
    const team = event ? isTeamEvent(event) : registrations.some(r => r.teamMembers?.length);
    const pickable = useMemo(() => events
        .filter(e => e.registrationOpen || registrations.some(r => r.eventId === e.id))
        .sort((a, b) => b.date.localeCompare(a.date)), [events, registrations]);

    const rows: Row[] = useMemo(() => registrations
        .filter(r => eventId === ALL_EVENTS || r.eventId === eventId)
        .map(r => ({ ...r, eventTitle: titles.get(r.eventId) ?? 'Evento apagado', team: r.teamMembers?.length || r.teamName ? teamSummary(r) : '' })), [registrations, eventId, titles]);

    const counts = useMemo(() => ({
        pending: rows.filter(r => r.status === 'pending').length,
        confirmed: rows.filter(r => r.status === 'confirmed').length,
        cancelled: rows.filter(r => r.status === 'cancelled').length,
    }), [rows]);

    const run = async (work: () => Promise<ActionResult>, done: string) => {
        setBusy(true);
        try {
            const result = await work();
            if (result.success) notify(done);
            else notify(describeActionError('error' in result ? result.error : undefined, 'Não foi possível atualizar.'), 'error');
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
        downloadCsv(registrationsCsv(attending, fields, eventId === ALL_EVENTS, team), csvFileName(event?.slug));
        notify('Lista exportada. Abre no Excel ou no Google Sheets.', 'info');
    };

    const printList = () => {
        if (!event) return;
        const fields = event.registrationFields ?? [];
        const questions = [...(team ? ['Equipa'] : []), ...fields.map(f => f.label)];
        const html = doorListHtml(event.title, `${formatEventDate(event.date)} · ${event.location}`, questions,
            attending.map(r => ({ name: r.name, phone: r.phone, status: r.status, answers: [...(team ? [r.team] : []), ...fields.map(f => String(r.customData?.[f.id] ?? ''))] })),
            team ? ['equipa', 'equipas'] : undefined);
        if (!printDoorList(html)) notify('O browser bloqueou a janela de impressão. Permita janelas para este site e tente de novo.', 'error');
    };

    const copyEmails = async () => {
        const emails = [...new Set(attending.map(r => r.email).filter(Boolean))].join('; ');
        if (!emails) { notify('Nenhuma destas inscrições tem email.', 'info'); return; }
        try {
            await navigator.clipboard.writeText(emails);
            notify('Emails copiados. Cole-os no campo Bcc de um email.', 'info');
        } catch {
            window.prompt('Copie os emails:', emails);
        }
    };

    return (
        <div className="space-y-6">
            <RegistrationsHeader
                events={pickable} eventId={eventId} onEventChange={setEventId} event={event} counts={counts} busy={busy}
                hasAttending={attending.length > 0} onConfirmPending={confirmPending} onAdd={() => setAdding(true)}
                onPrint={printList} onExport={exportList} onCopyEmails={() => void copyEmails()} notify={notify}
            />

            <EntityList<Row>
                items={rows}
                getKey={r => r.id}
                getTitle={r => r.name ?? 'Sem nome'}
                getSubtitle={r => [r.team || r.email, eventId === ALL_EVENTS ? r.eventTitle : undefined].filter(Boolean).join(' · ')}
                getStatus={r => <StatusBadge row={r} />}
                search={r => `${r.name ?? ''} ${r.email ?? ''} ${r.phone ?? ''} ${r.eventTitle} ${r.team} ${Object.values(r.customData ?? {}).join(' ')}`}
                filters={FILTERS}
                sorts={SORTS}
                searchPlaceholder={team ? 'Pesquisar por nome, equipa, email ou telemóvel' : 'Pesquisar por nome, email ou telemóvel'}
                noun={['inscrição', 'inscrições']}
                columns={[
                    { header: 'Participante', cell: r => <div><div className="font-medium text-white">{r.name}</div><div className="text-xs text-slate-400">{r.email || 'Sem email'}</div></div> },
                    ...(team ? [{ header: 'Equipa', cell: (r: Row) => <span className="line-clamp-2 max-w-[240px] text-slate-300">{r.team || '—'}</span> }] : []),
                    ...(eventId === ALL_EVENTS ? [{ header: 'Evento', cell: (r: Row) => <span className="line-clamp-1 max-w-[220px] text-slate-300">{r.eventTitle}</span> }] : []),
                    { header: 'Telemóvel', cell: r => <span className="tabular-nums text-slate-400">{r.phone || '—'}</span> },
                    { header: 'Inscrito em', cell: r => <span className="tabular-nums text-slate-400">{r.timestamp ? new Date(r.timestamp).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</span> },
                    { header: 'Estado', cell: r => <StatusBadge row={r} /> },
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
                emptyIcon={eventId === ALL_EVENTS ? ClipboardCheck : UserX}
                emptyTitle={eventId === ALL_EVENTS ? 'Ainda não há inscrições' : 'Ninguém se inscreveu ainda'}
                emptyDescription={eventId === ALL_EVENTS
                    ? 'Abra as inscrições num evento (Eventos → editar → «Aceitar inscrições pelo site») e partilhe-o no WhatsApp.'
                    : 'Partilhe o evento no WhatsApp ou no Facebook. Quem ligar ou aparecer no bar entra em «Adicionar».'}
            />

            {adding && event && <AddRegistrationModal event={event} onClose={() => setAdding(false)} notify={notify} />}

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
