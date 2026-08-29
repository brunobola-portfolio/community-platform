import React from 'react';
import { BarChart3, Edit2, Plus, Target, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ICON_MAP } from '../constants';
import type { AdminRecord, EntityHandlers } from '../types';
import type { ActionArea, Stat } from '../../../types';

interface HomepageTabProps extends EntityHandlers {
    actionAreas: ActionArea[];
    stats: Stat[];
    onNewStat: () => void;
}

const CardActions: React.FC<{ label: string; onEdit: () => void; onDelete: () => void }> = ({ label, onEdit, onDelete }) => (
    <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" aria-label={`Editar ${label}`} title="Editar" onClick={onEdit}>
            <Edit2 size={15} />
        </Button>
        <Button size="sm" variant="ghost" aria-label={`Apagar ${label}`} title="Apagar" className="text-red-400 hover:text-red-300" onClick={onDelete}>
            <Trash2 size={15} />
        </Button>
    </div>
);

/**
 * Homepage building blocks: the action areas grid and the stats ribbon. Actions
 * stay visible instead of appearing on hover — on touch there is no hover.
 */
export const HomepageTab: React.FC<HomepageTabProps> = ({ actionAreas, stats, openEditModal, handleDeleteRequest, onCreate, onNewStat }) => (
    <div className="space-y-10 animate-fade-in-up">
        <section>
            <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                    <Target size={18} className="text-brand-400" /> Áreas de Atuação
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-400">{actionAreas.length}</span>
                </h3>
                {onCreate && (
                    <Button size="sm" variant="outline" onClick={onCreate}><Plus size={14} /> Nova área</Button>
                )}
            </div>

            {actionAreas.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-dark-surface">
                    <EmptyState
                        icon={Target}
                        title="Sem áreas de atuação"
                        description="As áreas descrevem o que a associação faz e aparecem em destaque na página inicial."
                        action={onCreate ? { label: 'Criar área', onClick: onCreate } : undefined}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {actionAreas.map(area => {
                        const Icon = ICON_MAP[area.iconName] ?? ICON_MAP.Users;
                        return (
                            <article key={area.id} className="overflow-hidden rounded-2xl border border-white/10 bg-dark-surface">
                                <div className="relative h-28 bg-black/40">
                                    {area.imageUrl && <img src={area.imageUrl} alt="" className="h-full w-full object-cover opacity-40" />}
                                    <span className="absolute inset-0 flex items-center justify-center text-brand-400"><Icon size={28} /></span>
                                </div>
                                <div className="p-4">
                                    <div className="mb-1 flex items-start justify-between gap-2">
                                        <h4 className="truncate font-bold text-white">{area.title}</h4>
                                        <CardActions
                                            label={area.title}
                                            onEdit={() => openEditModal('actionArea', area as unknown as AdminRecord)}
                                            onDelete={() => handleDeleteRequest('actionArea', area.id, area.title)}
                                        />
                                    </div>
                                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{area.description}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>

        <section>
            <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                    <BarChart3 size={18} className="text-brand-400" /> Números em destaque
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-400">{stats.length}</span>
                </h3>
                <Button size="sm" variant="outline" onClick={onNewStat}><Plus size={14} /> Novo número</Button>
            </div>

            {stats.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-dark-surface">
                    <EmptyState
                        icon={BarChart3}
                        title="Sem números em destaque"
                        description="A faixa de números aparece logo abaixo do hero da página inicial (sócios, anos, eventos…)."
                        action={{ label: 'Criar número', onClick: onNewStat }}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map(stat => (
                        <div key={stat.id} className="rounded-2xl border border-white/10 bg-dark-surface p-4">
                            <div className="font-serif text-2xl font-bold text-white">{stat.value}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">{stat.label}</div>
                            <div className="mt-3 flex justify-end border-t border-white/5 pt-2">
                                <CardActions
                                    label={stat.label}
                                    onEdit={() => openEditModal('stat', stat as unknown as AdminRecord)}
                                    onDelete={() => handleDeleteRequest('stat', stat.id, stat.label)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    </div>
);
