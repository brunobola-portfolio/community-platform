import React from 'react';
import { Award } from 'lucide-react';
import { Badge } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import type { ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { SponsorTier } from '../../../types';

const SORTS: ListSort<SponsorTier>[] = [
    { key: 'order', label: 'Ordem', compare: (a, b) => (a.order ?? 99) - (b.order ?? 99) },
    { key: 'name', label: 'Nome A–Z', compare: (a, b) => a.name.localeCompare(b.name, 'pt') },
];

export const TiersTab: React.FC<EntityHandlers & { sponsorTiers: SponsorTier[] }> = ({ sponsorTiers, ...h }) => (
    <EntityList<SponsorTier>
        items={sponsorTiers}
        isLoading={h.isLoading}
        getKey={t => t.id}
        getTitle={t => t.name}
        getSubtitle={t => t.price}
        getStatus={t => <Badge>{t.benefits.length} {t.benefits.length === 1 ? 'benefício' : 'benefícios'}</Badge>}
        search={t => `${t.name} ${t.price} ${t.benefits.join(' ')}`}
        sorts={SORTS}
        searchPlaceholder="Pesquisar níveis de parceria"
        noun={['nível', 'níveis']}
        columns={[
            { header: 'Nível', cell: t => <span className="font-medium uppercase text-white">{t.name}</span> },
            { header: 'Valor', cell: t => <span className="text-brand-400">{t.price}</span> },
            {
                header: 'Benefícios',
                className: 'max-w-md',
                cell: t => (
                    <span className="line-clamp-2 text-xs text-slate-400">
                        {t.benefits.length > 0 ? t.benefits.join(' · ') : 'Sem benefícios definidos'}
                    </span>
                ),
            },
            { header: 'Ordem', cell: t => <span className="font-mono text-xs text-slate-500">{t.order ?? '—'}</span> },
        ]}
        onEdit={t => h.openEditModal('tier', t as unknown as AdminRecord)}
        onDelete={t => h.handleDeleteRequest('tier', t.id, t.name)}
        emptyIcon={Award}
        emptyTitle="Ainda não há níveis de parceria"
        emptyDescription="Defina os níveis (valor e benefícios) que aparecem no formulário de parcerias do portal."
        onCreate={h.onCreate}
        createLabel="Criar nível"
    />
);
