import React from 'react';
import { Landmark } from 'lucide-react';
import { EntityList } from '../components/EntityList';
import type { ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { Milestone } from '../../../types';

const SORTS: ListSort<Milestone>[] = [
    { key: 'year-asc', label: 'Ano · mais antigos', compare: (a, b) => a.year - b.year },
    { key: 'year-desc', label: 'Ano · mais recentes', compare: (a, b) => b.year - a.year },
    { key: 'order', label: 'Ordem na timeline', compare: (a, b) => (a.order ?? 99) - (b.order ?? 99) },
];

export const MilestonesTab: React.FC<EntityHandlers & { milestones: Milestone[] }> = ({ milestones, ...h }) => (
    <EntityList<Milestone>
        items={milestones}
        isLoading={h.isLoading}
        getKey={m => m.id}
        getTitle={m => `${m.year} — ${m.title}`}
        getSubtitle={m => m.description}
        getImage={m => m.imageUrl}
        search={m => `${m.year} ${m.title} ${m.description}`}
        sorts={SORTS}
        searchPlaceholder="Pesquisar marcos por ano ou título"
        noun={['marco', 'marcos']}
        columns={[
            { header: 'Ano', cell: m => <span className="font-mono text-brand-400">{m.year}</span> },
            {
                header: 'Marco',
                cell: m => (
                    <div className="flex items-center gap-3">
                        {m.imageUrl && <img src={m.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />}
                        <span className="font-medium text-white">{m.title}</span>
                    </div>
                ),
            },
            {
                header: 'Descrição',
                className: 'max-w-md',
                cell: m => <span className="line-clamp-2 text-slate-400">{m.description}</span>,
            },
            { header: 'Ordem', cell: m => <span className="font-mono text-xs text-slate-500">{m.order ?? '—'}</span> },
        ]}
        onEdit={m => h.openEditModal('milestone', m as unknown as AdminRecord)}
        onDelete={m => h.handleDeleteRequest('milestone', m.id, m.title)}
        emptyIcon={Landmark}
        emptyTitle="Ainda não há marcos históricos"
        emptyDescription="Cada marco é um ponto da linha do tempo na página História do portal."
        onCreate={h.onCreate}
        createLabel="Adicionar marco"
    />
);
