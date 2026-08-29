import React, { useMemo } from 'react';
import { User, Users } from 'lucide-react';
import { Badge } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { Member } from '../../../types';

const SORTS: ListSort<Member>[] = [
    { key: 'order', label: 'Ordem no site', compare: (a, b) => (a.order ?? 99) - (b.order ?? 99) },
    { key: 'name', label: 'Nome A–Z', compare: (a, b) => a.name.localeCompare(b.name, 'pt') },
];

const groupLabel = (group: string) => (group === 'founder' ? 'Sócios Fundadores' : group);

const Avatar: React.FC<{ member: Member }> = ({ member }) =>
    member.photoUrl
        ? <img src={member.photoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
        : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-500"><User size={16} /></span>;

export const MembersTab: React.FC<EntityHandlers & { members: Member[] }> = ({ members, ...h }) => {
    // Group chips follow the data, so new governing bodies appear without code changes
    const filters = useMemo<ListFilter<Member>[]>(() => {
        const groups = Array.from(new Set(members.map(m => m.group))).sort((a, b) => groupLabel(a).localeCompare(groupLabel(b), 'pt'));
        return [{ key: 'all', label: 'Todos', predicate: () => true }, ...groups.map(g => ({ key: g, label: groupLabel(g), predicate: (m: Member) => m.group === g }))];
    }, [members]);

    return (
        <EntityList<Member>
            items={members}
            isLoading={h.isLoading}
            getKey={m => m.id}
            getTitle={m => m.name}
            getSubtitle={m => m.role}
            getImage={m => m.photoUrl}
            getStatus={m => <Badge>{groupLabel(m.group)}</Badge>}
            search={m => `${m.name} ${m.role} ${groupLabel(m.group)}`}
            filters={filters}
            sorts={SORTS}
            searchPlaceholder="Pesquisar membros por nome, cargo ou órgão"
            noun={['membro', 'membros']}
            columns={[
                {
                    header: 'Nome',
                    cell: m => (
                        <div className="flex items-center gap-3">
                            <Avatar member={m} />
                            <span className="font-medium text-white">{m.name}</span>
                        </div>
                    ),
                },
                { header: 'Cargo', cell: m => <span className="text-slate-400">{m.role}</span> },
                { header: 'Órgão', cell: m => <Badge>{groupLabel(m.group)}</Badge> },
                { header: 'Ordem', cell: m => <span className="font-mono text-xs text-slate-500">{m.order ?? '—'}</span> },
            ]}
            onEdit={m => h.openEditModal('member', m as unknown as AdminRecord)}
            onDelete={m => h.handleDeleteRequest('member', m.id, m.name)}
            onDuplicate={h.handleDuplicate ? m => h.handleDuplicate?.('member', m as unknown as AdminRecord) : undefined}
            emptyIcon={Users}
            emptyTitle="Ainda não há membros"
            emptyDescription="Adicione os corpos sociais para os apresentar na página Equipa do portal."
            onCreate={h.onCreate}
            createLabel="Adicionar membro"
        />
    );
};
