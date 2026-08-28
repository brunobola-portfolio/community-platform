import React from 'react';
import { Edit2, Trash2, Copy, Trophy } from 'lucide-react';
import { Button, Badge } from '../../../components/ui/UIComponents';
import { AdminEntityTable } from '../AdminEntityTable';
import { AdminCard } from '../components/AdminCard';
import { AdminListToolbar, AdminListEmpty } from '../components/AdminListToolbar';
import { useAdminList, type ListFilter, type ListSort } from '../../../hooks/useAdminList';
import type { EntityHandlers } from '../AdminEntityTabs';
import type { Event } from '../../../types';

type AdminEvent = Event & { category: string };

const isUpcoming = (e: AdminEvent) => new Date(e.date).getTime() >= Date.now() - 24 * 3600 * 1000;

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

const fill = (e: AdminEvent) => (e.isTournament && e.maxParticipants ? (e.currentParticipants ?? 0) / e.maxParticipants : -1);

// Static class list so Tailwind can see every width (no inline styles); the
// bar is quantized to 10% steps, which is all a 128px bar can show anyway
const WIDTH_CLASSES = ['w-0', 'w-[10%]', 'w-[20%]', 'w-[30%]', 'w-[40%]', 'w-[50%]', 'w-[60%]', 'w-[70%]', 'w-[80%]', 'w-[90%]', 'w-full'];

const Occupancy: React.FC<{ event: AdminEvent }> = ({ event }) => {
    if (!event.isTournament || !event.maxParticipants) return <span className="text-slate-500 text-xs">-</span>;
    const current = event.currentParticipants ?? 0;
    const percent = Math.min(100, Math.round((current / event.maxParticipants) * 100));
    const width = WIDTH_CLASSES[Math.min(10, Math.max(current > 0 ? 1 : 0, Math.round(percent / 10)))];
    return (
        <div className="w-32">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1 tabular-nums"><span>{current}/{event.maxParticipants}</span><span>{percent}%</span></div>
            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : 'bg-brand-500'} ${width}`} />
            </div>
        </div>
    );
};

export const EventsTab: React.FC<EntityHandlers & { events: AdminEvent[] }> = ({ events, ...h }) => {
    const list = useAdminList(events, {
        searchText: e => `${e.title} ${e.category} ${e.location ?? ''} ${e.tournamentType ?? ''}`,
        filters: FILTERS,
        sorts: SORTS,
    });

    return (
        <div className="space-y-4 animate-fade-in-up">
            <AdminListToolbar list={list} placeholder="Pesquisar eventos por título, local ou categoria" noun={['evento', 'eventos']} />
            {list.visible.length === 0 ? (
                <AdminListEmpty query={list.query} noun="evento" />
            ) : (
                <>
                    <AdminEntityTable headers={['Evento', 'Data', 'Ocupação / Estado', 'Tipo']}>
                        {list.visible.map(ev => (
                            <tr key={ev.id} className="hover:bg-white/[0.02]">
                                <td className="p-4 font-medium text-white">
                                    {ev.title}
                                    {ev.status === 'draft' && <Badge className="ml-2 bg-slate-500/10 text-slate-400 border-slate-500/20">Rascunho</Badge>}
                                    {!isUpcoming(ev) && ev.status !== 'draft' && <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">Passado</span>}
                                </td>
                                <td className="p-4 text-slate-400 font-variant-numeric tabular-nums">{new Date(ev.date).toLocaleDateString('pt-PT')}</td>
                                <td className="p-4"><Occupancy event={ev} /></td>
                                <td className="p-4">{ev.isTournament ? <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Torneio{ev.entryPrice ? ` (${ev.entryPrice} EUR)` : ''}</Badge> : <Badge>{ev.category}</Badge>}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        {h.handleDuplicate && <Button size="sm" variant="ghost" aria-label="Duplicar" onClick={() => h.handleDuplicate?.('event', ev)}><Copy size={16} /></Button>}
                                        <Button size="sm" variant="ghost" aria-label="Editar" onClick={() => h.openEditModal('event', ev)}><Edit2 size={16} /></Button>
                                        <Button size="sm" variant="ghost" aria-label="Apagar" className="text-red-400" onClick={() => h.handleDeleteRequest('event', ev.id, ev.title)}><Trash2 size={16} /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminEntityTable>
                    <div className="md:hidden space-y-4">
                        {list.visible.map(ev => (
                            <AdminCard
                                key={ev.id}
                                image={ev.imageUrl}
                                title={ev.title}
                                subtitle={new Date(ev.date).toLocaleDateString('pt-PT')}
                                status={ev.isTournament ? <div className="text-xs text-amber-400 mt-1 flex items-center gap-2"><Trophy size={12} /> Torneio ({ev.currentParticipants ?? 0}/{ev.maxParticipants})</div> : <Badge>{ev.category}</Badge>}
                                actions={<>
                                    <Button size="sm" variant="ghost" aria-label="Duplicar" onClick={() => h.handleDuplicate?.('event', ev)}><Copy size={16} /></Button>
                                    <Button size="sm" variant="ghost" aria-label="Editar" onClick={() => h.openEditModal('event', ev)}><Edit2 size={16} /></Button>
                                    <Button size="sm" variant="ghost" aria-label="Apagar" className="text-red-400" onClick={() => h.handleDeleteRequest('event', ev.id, ev.title)}><Trash2 size={16} /></Button>
                                </>}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
