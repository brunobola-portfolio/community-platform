import React, { useMemo } from 'react';
import { Edit2, Trash2, Copy, User } from 'lucide-react';
import { Button, Badge } from '../../../components/ui/UIComponents';
import { AdminEntityTable } from '../AdminEntityTable';
import { AdminCard } from '../components/AdminCard';
import { AdminListToolbar, AdminListEmpty } from '../components/AdminListToolbar';
import { useAdminList, type ListFilter, type ListSort } from '../../../hooks/useAdminList';
import type { EntityHandlers } from '../AdminEntityTabs';
import type { Member } from '../../../types';

const SORTS: ListSort<Member>[] = [
    { key: 'order', label: 'Ordem no site', compare: (a, b) => (a.order ?? 99) - (b.order ?? 99) },
    { key: 'name', label: 'Nome A–Z', compare: (a, b) => a.name.localeCompare(b.name, 'pt') },
];

const groupLabel = (group: string) => (group === 'founder' ? 'Sócios Fundadores' : group);

const Avatar: React.FC<{ member: Member }> = ({ member }) =>
    member.photoUrl
        ? <img src={member.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
        : <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-500 shrink-0"><User size={16} /></div>;

export const MembersTab: React.FC<EntityHandlers & { members: Member[] }> = ({ members, ...h }) => {
    // Group chips follow the data, so new governing bodies appear without code changes
    const filters = useMemo<ListFilter<Member>[]>(() => {
        const groups = Array.from(new Set(members.map(m => m.group))).sort((a, b) => groupLabel(a).localeCompare(groupLabel(b), 'pt'));
        return [{ key: 'all', label: 'Todos', predicate: () => true }, ...groups.map(g => ({ key: g, label: groupLabel(g), predicate: (m: Member) => m.group === g }))];
    }, [members]);

    const list = useAdminList(members, {
        searchText: m => `${m.name} ${m.role} ${groupLabel(m.group)}`,
        filters,
        sorts: SORTS,
    });

    return (
        <div className="space-y-4 animate-fade-in-up">
            <AdminListToolbar list={list} placeholder="Pesquisar membros por nome, cargo ou órgão" noun={['membro', 'membros']} />
            {list.visible.length === 0 ? (
                <AdminListEmpty query={list.query} noun="membro" />
            ) : (
                <>
                    <AdminEntityTable headers={['Nome', 'Cargo', 'Órgão', 'Ordem']}>
                        {list.visible.map(m => (
                            <tr key={m.id} className="hover:bg-white/[0.02]">
                                <td className="p-4 font-medium text-white"><div className="flex items-center gap-3"><Avatar member={m} />{m.name}</div></td>
                                <td className="p-4 text-slate-400">{m.role}</td>
                                <td className="p-4"><Badge>{groupLabel(m.group)}</Badge></td>
                                <td className="p-4 text-slate-500 font-mono text-xs">{m.order ?? '-'}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        {h.handleDuplicate && <Button size="sm" variant="ghost" aria-label="Duplicar" onClick={() => h.handleDuplicate?.('member', m)}><Copy size={16} /></Button>}
                                        <Button size="sm" variant="ghost" aria-label="Editar" onClick={() => h.openEditModal('member', m)}><Edit2 size={16} /></Button>
                                        <Button size="sm" variant="ghost" aria-label="Apagar" className="text-red-400" onClick={() => h.handleDeleteRequest('member', m.id, m.name)}><Trash2 size={16} /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminEntityTable>
                    <div className="md:hidden space-y-4">
                        {list.visible.map(m => (
                            <AdminCard key={m.id} image={m.photoUrl} title={m.name} subtitle={m.role} status={<Badge>{groupLabel(m.group)}</Badge>} actions={<Button size="sm" variant="ghost" aria-label="Editar" onClick={() => h.openEditModal('member', m)}><Edit2 size={16} /></Button>} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
