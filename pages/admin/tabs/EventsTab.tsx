import React, { useMemo } from 'react';
import { CalendarOff } from 'lucide-react';
import { Badge } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { Event, Registration } from '../../../types';
import { progressWidthClass } from '../../../utils/text';

type AdminEvent = Event & { category: string };

const isUpcoming = (e: AdminEvent) => new Date(e.date).getTime() >= Date.now() - 24 * 3600 * 1000;
const fill = (e: AdminEvent) => (e.maxParticipants ? (e.currentParticipants ?? 0) / e.maxParticipants : -1);

const FILTERS: ListFilter<AdminEvent>[] = [
    { key: 'all', label: 'Todos', predicate: () => true },
    { key: 'upcoming', label: 'Próximos', predicate: e => isUpcoming(e) && e.status !== 'draft' },
    { key: 'past', label: 'Passados', predicate: e => !isUpcoming(e) && e.status !== 'draft' },
    { key: 'tournaments', label: 'Torneios', predicate: e => Boolean(e.isTournament) },
    { key: 'drafts', label: 'Rascunhos', predicate: e => e.status === 'draft' },
];

const SORTS: ListSort<AdminEvent>[] = [
    { key: 'date-desc', label: 'Data · mais recentes', compare: (a, b) => b.date.localeCompare(a.date) },
    { key: 'date-asc', label: 'Data · mais antigos', compare: (a, b) => a.date.localeCompare(b.date) },
    { key: 'title', label: 'Título A–Z', compare: (a, b) => a.title.localeCompare(b.title, 'pt') },
    { key: 'fill', label: 'Ocupação', compare: (a, b) => fill(b) - fill(a) },
];

const Occupancy: React.FC<{ event: AdminEvent }> = ({ event }) => {
    if (!event.maxParticipants) return <span className="text-xs text-slate-400">{event.registrationOpen ? 'Sem limite' : '—'}</span>;
    const current = event.currentParticipants ?? 0;
    const percent = Math.min(100, Math.round((current / event.maxParticipants) * 100));
    const width = progressWidthClass(percent);
    return (
        <div className="w-32">
            <div className="mb-1 flex justify-between text-[10px] tabular-nums text-slate-400">
                <span>{current}/{event.maxParticipants}</span><span>{percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-label="Lotação" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : 'bg-brand-500'} ${width}`} />
            </div>
        </div>
    );
};

const StatusCell: React.FC<{ event: AdminEvent }> = ({ event }) => {
    if (event.status === 'draft') return <Badge className="border-slate-500/20 bg-slate-500/10 text-slate-400">Rascunho</Badge>;
    if (!isUpcoming(event)) return <Badge className="border-white/10 bg-white/5 text-slate-400">Passado</Badge>;
    return <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">Publicado</Badge>;
};

interface RegistrationTally { pending: number; active: number }

/** Count of who signed up, with what still waits for the board; opens the event in Inscrições. */
const RegistrationsCell: React.FC<{ event: AdminEvent; tally?: RegistrationTally; onOpen?: (eventId: string) => void }> = ({ event, tally, onOpen }) => {
    const active = tally?.active ?? 0;
    // A past event nobody signed up for is noise, whatever its old switch says
    if (!active && (!event.registrationOpen || !isUpcoming(event))) return <span className="text-xs text-slate-400">—</span>;
    const [one, many] = (event.teamSize ?? 1) >= 2 ? ['equipa', 'equipas'] : ['inscrito', 'inscritos'];
    const label = `${active} ${active === 1 ? one : many}`;
    return (
        <button type="button" onClick={e => { e.stopPropagation(); onOpen?.(event.id); }} className="group flex flex-col items-start rounded-lg px-2 py-1 text-left hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={`Ver inscrições de ${event.title}`}>
            <span className="text-sm font-medium tabular-nums text-white group-hover:text-brand-300">{label}</span>
            {tally?.pending ? <span className="text-[11px] font-semibold text-amber-300">{tally.pending} por confirmar</span> : <span className="text-[11px] text-slate-400">Ver inscrições</span>}
        </button>
    );
};

interface EventsTabProps extends EntityHandlers {
    events: AdminEvent[];
    registrations?: Registration[];
    onOpenRegistrations?: (eventId: string) => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({ events, registrations = [], onOpenRegistrations, ...h }) => {
    const tallies = useMemo(() => {
        const map = new Map<string, RegistrationTally>();
        for (const r of registrations) {
            if (r.status === 'cancelled') continue;
            const t = map.get(r.eventId) ?? { pending: 0, active: 0 };
            t.active++;
            if (r.status === 'pending') t.pending++;
            map.set(r.eventId, t);
        }
        return map;
    }, [registrations]);
    return (
    <EntityList<AdminEvent>
        items={events}
        isLoading={h.isLoading}
        getKey={e => e.id}
        getTitle={e => e.title}
        getSubtitle={e => `${new Date(e.date).toLocaleDateString('pt-PT')} · ${e.location}`}
        getImage={e => e.imageUrl}
        getStatus={e => <StatusCell event={e} />}
        search={e => `${e.title} ${e.category} ${e.location ?? ''} ${e.tournamentType ?? ''}`}
        filters={FILTERS}
        sorts={SORTS}
        searchPlaceholder="Pesquisar eventos por título, local ou categoria"
        noun={['evento', 'eventos']}
        columns={[
            {
                header: 'Evento',
                cell: e => (
                    <div className="flex items-center gap-3">
                        {e.imageUrl && <img src={e.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />}
                        <span className="line-clamp-2 max-w-xs font-medium text-white">{e.title}</span>
                    </div>
                ),
            },
            { header: 'Data', cell: e => <span className="tabular-nums text-slate-400">{new Date(e.date).toLocaleDateString('pt-PT')}</span> },
            { header: 'Estado', cell: e => <StatusCell event={e} /> },
            { header: 'Inscrições', cell: e => <RegistrationsCell event={e} tally={tallies.get(e.id)} onOpen={onOpenRegistrations} /> },
            { header: 'Ocupação', cell: e => <Occupancy event={e} /> },
            {
                header: 'Tipo',
                cell: e => (e.isTournament
                    ? <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-400">Torneio{e.entryPrice ? ` · ${e.entryPrice}€` : ''}</Badge>
                    : <Badge>{e.category}</Badge>),
            },
        ]}
        onEdit={e => h.openEditModal('event', e as unknown as AdminRecord)}
        onDelete={e => h.handleDeleteRequest('event', e.id, e.title)}
        onDuplicate={h.handleDuplicate ? e => h.handleDuplicate?.('event', e as unknown as AdminRecord) : undefined}
        emptyIcon={CalendarOff}
        emptyTitle="Ainda não há eventos"
        emptyDescription="Crie o primeiro evento para o mostrar na agenda do portal e abrir inscrições."
        onCreate={h.onCreate}
        createLabel="Criar evento"
    />
    );
};
