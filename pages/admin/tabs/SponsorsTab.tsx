import React, { useMemo } from 'react';
import { Building2, Handshake } from 'lucide-react';
import { Badge } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { Sponsor, SponsorTier } from '../../../types';
import { sponsorTierLabel } from '../../../utils/sponsorTiers';

const SORTS: ListSort<Sponsor>[] = [
    { key: 'name', label: 'Nome A–Z', compare: (a, b) => a.name.localeCompare(b.name, 'pt') },
    { key: 'tier', label: 'Nível', compare: (a, b) => a.tier.localeCompare(b.tier, 'pt') },
];

interface SponsorsTabProps extends EntityHandlers {
    sponsors: Sponsor[];
    sponsorTiers: SponsorTier[];
}

const Logo: React.FC<{ sponsor: Sponsor }> = ({ sponsor }) =>
    sponsor.logoUrl
        ? <img src={sponsor.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-md bg-white object-contain p-0.5" />
        : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-500"><Building2 size={16} /></span>;

const Status: React.FC<{ active?: boolean }> = ({ active }) =>
    active !== false
        ? <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">Ativo</Badge>
        : <Badge className="border-slate-500/20 bg-slate-500/10 text-slate-400">Inativo</Badge>;

export const SponsorsTab: React.FC<SponsorsTabProps> = ({ sponsors, sponsorTiers, ...h }) => {
    const label = (value: string) => sponsorTierLabel(sponsorTiers, value);
    // Tier chips follow the data so new partnership levels need no code change
    const filters = useMemo<ListFilter<Sponsor>[]>(() => {
        const tiers = Array.from(new Set(sponsors.map(s => s.tier))).sort((a, b) => a.localeCompare(b, 'pt'));
        return [
            { key: 'all', label: 'Todos', predicate: () => true },
            { key: 'active', label: 'Ativos', predicate: s => s.active !== false },
            { key: 'inactive', label: 'Inativos', predicate: s => s.active === false },
            ...tiers.map(t => ({ key: `tier:${t}`, label: sponsorTierLabel(sponsorTiers, t), predicate: (s: Sponsor) => s.tier === t })),
        ];
    }, [sponsors, sponsorTiers]);

    return (
        <EntityList<Sponsor>
            items={sponsors}
            isLoading={h.isLoading}
            getKey={s => s.id}
            getTitle={s => s.name}
            getSubtitle={s => label(s.tier)}
            getImage={s => s.logoUrl}
            getStatus={s => <Status active={s.active} />}
            search={s => `${s.name} ${label(s.tier)} ${s.website ?? ''}`}
            filters={filters}
            sorts={SORTS}
            searchPlaceholder="Pesquisar parceiros por nome ou nível"
            noun={['parceiro', 'parceiros']}
            columns={[
                {
                    header: 'Entidade',
                    cell: s => (
                        <div className="flex items-center gap-3">
                            <Logo sponsor={s} />
                            <span className="font-medium text-white">{s.name}</span>
                        </div>
                    ),
                },
                { header: 'Nível', cell: s => <Badge>{label(s.tier)}</Badge> },
                { header: 'Estado', cell: s => <Status active={s.active} /> },
                {
                    header: 'Website',
                    cell: s => (s.website
                        ? <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:underline">{s.website.replace(/^https?:\/\//, '')}</a>
                        : <span className="text-xs text-slate-600">—</span>),
                },
            ]}
            onEdit={s => h.openEditModal('sponsor', s as unknown as AdminRecord)}
            onDelete={s => h.handleDeleteRequest('sponsor', s.id, s.name)}
            emptyIcon={Handshake}
            emptyTitle="Ainda não há parceiros"
            emptyDescription="Registe os apoios da associação para os mostrar na faixa de parceiros do portal."
            onCreate={h.onCreate}
            createLabel="Adicionar parceiro"
        />
    );
};
