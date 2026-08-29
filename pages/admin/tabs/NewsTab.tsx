import React from 'react';
import { FileText } from 'lucide-react';
import { Badge } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { Post } from '../../../types';

type AdminPost = Post & { category: string };

const FILTERS: ListFilter<AdminPost>[] = [
    { key: 'all', label: 'Todas', predicate: () => true },
    { key: 'published', label: 'Publicadas', predicate: p => Boolean(p.published) },
    { key: 'drafts', label: 'Rascunhos', predicate: p => !p.published },
];

const SORTS: ListSort<AdminPost>[] = [
    { key: 'date-desc', label: 'Data · mais recentes', compare: (a, b) => b.date.localeCompare(a.date) },
    { key: 'date-asc', label: 'Data · mais antigas', compare: (a, b) => a.date.localeCompare(b.date) },
    { key: 'title', label: 'Título A–Z', compare: (a, b) => a.title.localeCompare(b.title, 'pt') },
];

const Status: React.FC<{ published?: boolean }> = ({ published }) =>
    published
        ? <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">Publicada</Badge>
        : <Badge className="border-slate-500/20 bg-slate-500/10 text-slate-400">Rascunho</Badge>;

export const NewsTab: React.FC<EntityHandlers & { posts: AdminPost[] }> = ({ posts, ...h }) => (
    <EntityList<AdminPost>
        items={posts}
        isLoading={h.isLoading}
        getKey={p => p.id}
        getTitle={p => p.title}
        getSubtitle={p => `${new Date(p.date).toLocaleDateString('pt-PT')}${p.author ? ` · ${p.author}` : ''}`}
        getImage={p => p.coverUrl}
        getStatus={p => <Status published={p.published} />}
        search={p => `${p.title} ${p.category} ${p.author ?? ''} ${p.excerpt ?? ''}`}
        filters={FILTERS}
        sorts={SORTS}
        searchPlaceholder="Pesquisar notícias por título, autor ou categoria"
        noun={['notícia', 'notícias']}
        columns={[
            {
                header: 'Título',
                cell: p => (
                    <div className="flex items-center gap-3">
                        {p.coverUrl && <img src={p.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />}
                        <span className="line-clamp-2 max-w-sm font-medium text-white">{p.title}</span>
                    </div>
                ),
            },
            { header: 'Categoria', cell: p => <Badge>{p.category}</Badge> },
            { header: 'Data', cell: p => <span className="tabular-nums text-slate-400">{new Date(p.date).toLocaleDateString('pt-PT')}</span> },
            { header: 'Estado', cell: p => <Status published={p.published} /> },
        ]}
        onEdit={p => h.openEditModal('post', p as unknown as AdminRecord)}
        onDelete={p => h.handleDeleteRequest('post', p.id, p.title)}
        onDuplicate={h.handleDuplicate ? p => h.handleDuplicate?.('post', p as unknown as AdminRecord) : undefined}
        emptyIcon={FileText}
        emptyTitle="Ainda não há notícias"
        emptyDescription="Publique a primeira notícia para dar novidades à comunidade na página inicial e no blog."
        onCreate={h.onCreate}
        createLabel="Escrever notícia"
    />
);
