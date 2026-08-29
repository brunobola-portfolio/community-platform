import React from 'react';
import { CalendarOff } from 'lucide-react';
import { Badge } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { Event } from '../../../types';

type AdminEvent = Event & { category: string };

const isUpcoming = (e: AdminEvent) => new Date(e.date).getTime() >= Date.now() - 24 * 3600 * 1000;
const fill = (e: AdminEvent) => (e.isTournament && e.maxParticipants ? (e.currentParticipants ?? 0) / e.maxParticipants : -1);

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

// Static class list so Tailwind can see every width (no inline styles); the
// bar is quantized to 10% steps, which is all a 128px bar can show anyway
const WIDTH_CLASSES = ['w-0', 'w-[10%]', 'w-[20%]', 'w-[30%]', 'w-[40%]', 'w-[50%]', 'w-[60%]', 'w-[70%]', 'w-[80%]', 'w-[90%]', 'w-full'];

const Occupancy: React.FC<{ event: AdminEvent }> = ({ event }) => {
    if (!event.isTournament || !event.maxParticipants) return <span className="text-xs text-slate-500">—</span>;
    const current = event.currentParticipants ?? 0;
    const percent = Math.min(100, Math.round((current / event.maxParticipants) * 100));
    const width = WIDTH_CLASSES[Math.min(10, Math.max(current > 0 ? 1 : 0, Math.round(percent / 10)))];
    return (
        <div className="w-32">
            <div className="mb-1 flex justify-between text-[10px] tabular-nums text-slate-400">
                <span>{current}/{event.maxParticipants}</span><span>{percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
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

export const EventsTab: React.FC<EntityHandlers & { events: AdminEvent[] }> = ({ events, ...h }) => (
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
