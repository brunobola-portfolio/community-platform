import React from 'react';
import { Edit2, Trash2, Copy } from 'lucide-react';
import { Button, Badge } from '../../../components/ui/UIComponents';
import { AdminEntityTable } from '../AdminEntityTable';
import { AdminCard } from '../components/AdminCard';
import { AdminListToolbar, AdminListEmpty } from '../components/AdminListToolbar';
import { useAdminList, type ListFilter, type ListSort } from '../../../hooks/useAdminList';
import type { EntityHandlers } from '../AdminEntityTabs';
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
        ? <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Publicada</Badge>
        : <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">Rascunho</Badge>;

export const NewsTab: React.FC<EntityHandlers & { posts: AdminPost[] }> = ({ posts, ...h }) => {
    const list = useAdminList(posts, {
        searchText: p => `${p.title} ${p.category} ${p.author ?? ''} ${p.excerpt ?? ''}`,
        filters: FILTERS,
        sorts: SORTS,
    });

    return (
        <div className="space-y-4 animate-fade-in-up">
            <AdminListToolbar list={list} placeholder="Pesquisar notícias por título, autor ou categoria" noun={['notícia', 'notícias']} />
            {list.visible.length === 0 ? (
                <AdminListEmpty query={list.query} noun="notícia" />
            ) : (
                <>
                    <AdminEntityTable headers={['Título', 'Categoria', 'Data', 'Estado']}>
                        {list.visible.map(p => (
                            <tr key={p.id} className="hover:bg-white/[0.02]">
                                <td className="p-4 font-medium text-white">
                                    <div className="flex items-center gap-3">
                                        {p.coverUrl && <img src={p.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                                        <span className="line-clamp-2">{p.title}</span>
                                    </div>
                                </td>
                                <td className="p-4"><Badge>{p.category}</Badge></td>
                                <td className="p-4 text-slate-400 font-variant-numeric tabular-nums">{new Date(p.date).toLocaleDateString('pt-PT')}</td>
                                <td className="p-4"><Status published={p.published} /></td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        {h.handleDuplicate && <Button size="sm" variant="ghost" aria-label="Duplicar" onClick={() => h.handleDuplicate?.('post', p)}><Copy size={16} /></Button>}
                                        <Button size="sm" variant="ghost" aria-label="Editar" onClick={() => h.openEditModal('post', p)}><Edit2 size={16} /></Button>
                                        <Button size="sm" variant="ghost" aria-label="Apagar" className="text-red-400" onClick={() => h.handleDeleteRequest('post', p.id, p.title)}><Trash2 size={16} /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminEntityTable>
                    <div className="md:hidden space-y-4">
                        {list.visible.map(p => (
                            <AdminCard key={p.id} image={p.coverUrl} title={p.title} subtitle={new Date(p.date).toLocaleDateString('pt-PT')} status={<Status published={p.published} />} actions={<Button size="sm" variant="ghost" aria-label="Editar" onClick={() => h.openEditModal('post', p)}><Edit2 size={16} /></Button>} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
