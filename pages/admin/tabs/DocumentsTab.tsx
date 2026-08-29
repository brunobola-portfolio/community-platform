import React, { useMemo } from 'react';
import { FileBox, ExternalLink } from 'lucide-react';
import { Badge } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { Document as AppDocument } from '../../../types';

const SORTS: ListSort<AppDocument>[] = [
    { key: 'date-desc', label: 'Data · mais recentes', compare: (a, b) => (b.date ?? '').localeCompare(a.date ?? '') },
    { key: 'title', label: 'Título A–Z', compare: (a, b) => a.title.localeCompare(b.title, 'pt') },
];

export const DocumentsTab: React.FC<EntityHandlers & { documents: AppDocument[] }> = ({ documents, ...h }) => {
    const filters = useMemo<ListFilter<AppDocument>[]>(() => {
        const categories = Array.from(new Set(documents.map(d => d.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt'));
        return [
            { key: 'all', label: 'Todos', predicate: () => true },
            ...categories.map(c => ({ key: `cat:${c}`, label: c, predicate: (d: AppDocument) => d.category === c })),
        ];
    }, [documents]);

    return (
        <EntityList<AppDocument>
            items={documents}
            isLoading={h.isLoading}
            getKey={d => d.id}
            getTitle={d => d.title}
            getSubtitle={d => d.date}
            getStatus={d => <Badge>{d.category}</Badge>}
            search={d => `${d.title} ${d.category} ${d.description ?? ''}`}
            filters={filters}
            sorts={SORTS}
            searchPlaceholder="Pesquisar documentos por título ou categoria"
            noun={['documento', 'documentos']}
            columns={[
                {
                    header: 'Documento',
                    className: 'max-w-sm',
                    cell: d => (
                        <div className="min-w-0">
                            <span className="block truncate font-medium text-white">{d.title}</span>
                            {d.description && <span className="block truncate text-xs text-slate-500">{d.description}</span>}
                        </div>
                    ),
                },
                { header: 'Categoria', cell: d => <Badge>{d.category}</Badge> },
                { header: 'Data', cell: d => <span className="tabular-nums text-slate-400">{d.date}</span> },
                {
                    header: 'Ficheiro',
                    cell: d => (d.externalUrl
                        ? (
                            <a href={d.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-400 hover:underline">
                                <ExternalLink size={12} /> Abrir
                            </a>
                        )
                        : <span className="text-xs text-amber-400">Sem ligação</span>),
                },
            ]}
            onEdit={d => h.openEditModal('document', d as unknown as AdminRecord)}
            onDelete={d => h.handleDeleteRequest('document', d.id, d.title)}
            onDuplicate={h.handleDuplicate ? d => h.handleDuplicate?.('document', d as unknown as AdminRecord) : undefined}
            emptyIcon={FileBox}
            emptyTitle="Ainda não há documentos"
            emptyDescription="Publique estatutos, atas ou regulamentos para os sócios consultarem na área reservada."
            onCreate={h.onCreate}
            createLabel="Adicionar documento"
        />
    );
};
