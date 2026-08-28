
/**
 * Entity listing tabs for the admin panel.
 * Each component renders a table (desktop) and card list (mobile) for a specific entity type.
 */

import React from 'react';
import { Edit2, Trash2, Copy, Target, BarChart3, X } from 'lucide-react';
import { Button, Badge } from '../../components/ui/UIComponents';
import { AdminEntityTable } from './AdminEntityTable';
import { AdminCard } from '../admin/components/AdminCard';
import { ICON_MAP } from './constants';
import { categoryColorClass } from '../../utils/categoryColors';
import type {
    Sponsor, SponsorTier, Category,
    Album, ActionArea, Stat, Registration, Milestone
} from '../../types';
import type { Notification as AppNotification, Document as AppDocument } from '../../types';

type AnyRecord = Record<string, any>;

export interface EntityHandlers {
    openEditModal: (type: string, item: AnyRecord) => void;
    handleDeleteRequest: (type: string, id: string, title: string) => void;
    handleDuplicate?: (type: string, item: AnyRecord) => void;
}

const ActionRow: React.FC<{ type: string; item: AnyRecord; h: EntityHandlers }> = ({ type, item, h }) => (
    <td className="p-4 text-right flex justify-end gap-1">
        {h.handleDuplicate && <Button size="sm" variant="ghost" aria-label="Duplicar" title="Duplicar" onClick={() => h.handleDuplicate!(type, item)}><Copy size={16} /></Button>}
        <Button size="sm" variant="ghost" aria-label="Editar" title="Editar" onClick={() => h.openEditModal(type, item)}><Edit2 size={16} /></Button>
        <Button size="sm" variant="ghost" aria-label="Apagar" title="Apagar" className="text-red-400" onClick={() => h.handleDeleteRequest(type, item.id, item.title ?? item.name ?? item.label ?? '')}><Trash2 size={16} /></Button>
    </td>
);

export const HomepageTab: React.FC<EntityHandlers & { actionAreas: ActionArea[]; stats: Stat[] }> = ({ actionAreas, stats, openEditModal, handleDeleteRequest }) => (
    <div className="space-y-12 animate-fade-in-up">
        <section>
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Target className="text-brand-400" /> Áreas de Atuação</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {actionAreas.map(aa => {
                    const Icon = ICON_MAP[aa.iconName] || ICON_MAP['Users'];
                    return (
                        <div key={aa.id} className="bg-dark-surface border border-white/10 rounded-2xl overflow-hidden group">
                            <div className="h-32 bg-black/40 relative">
                                <img src={aa.imageUrl} alt={aa.title} className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center"><Icon size={32} className="text-brand-400" /></div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-white">{aa.title}</h4>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEditModal('actionArea', aa)} className="p-1.5 text-slate-500 hover:text-white transition-colors"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDeleteRequest('actionArea', aa.id, aa.title)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2">{aa.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
        <section>
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 className="text-brand-400" /> Estatísticas (Ribbon)</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(s => (
                    <div key={s.id} className="bg-dark-surface border border-white/10 p-4 rounded-xl group hover:border-brand-500/50 transition-colors">
                        <div className="text-2xl font-serif font-bold text-white mb-1">{s.value}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">{s.label}</div>
                        <div className="flex gap-2 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal('stat', s)} className="text-[10px] text-brand-400 hover:underline">Editar</button>
                            <button onClick={() => handleDeleteRequest('stat', s.id, s.label)} className="text-[10px] text-red-400 hover:underline">Apagar</button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    </div>
);




export const SponsorsTab: React.FC<EntityHandlers & { sponsors: Sponsor[] }> = ({ sponsors, ...h }) => (
    <>
        <AdminEntityTable headers={['Entidade', 'Nível', 'Status']}>
            {sponsors.map(s => (<tr key={s.id} className="hover:bg-white/5"><td className="p-4 flex items-center gap-3"><img src={s.logoUrl} alt={s.name} className="w-8 h-8 object-contain bg-white rounded-md p-0.5" />{s.name}</td><td className="p-4"><Badge>{s.tier}</Badge></td><td className={`p-4 ${s.active !== false ? 'text-green-400' : 'text-slate-500'}`}>{s.active !== false ? 'Ativo' : 'Inativo'}</td><ActionRow type="sponsor" item={s} h={h} /></tr>))}
        </AdminEntityTable>
        <div className="md:hidden space-y-4">{sponsors.map(s => <AdminCard key={s.id} image={s.logoUrl} title={s.name} subtitle={s.tier} status={s.active !== false ? <Badge>Ativo</Badge> : <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">Inativo</Badge>} actions={<Button size="sm" variant="ghost" aria-label="Editar" title="Editar" onClick={() => h.openEditModal('sponsor', s)}><Edit2 size={16} /></Button>} />)}</div>
    </>
);

export const MilestonesTab: React.FC<EntityHandlers & { milestones: Milestone[] }> = ({ milestones, ...h }) => (
    <>
        <AdminEntityTable headers={['Ano', 'Marco', 'Descrição']}>
            {milestones.map(m => (
                <tr key={m.id} className="hover:bg-white/5">
                    <td className="p-4 font-mono text-brand-400">{m.year}</td>
                    <td className="p-4 font-medium text-white">{m.title}</td>
                    <td className="p-4 text-slate-400 max-w-md"><span className="line-clamp-2">{m.description}</span></td>
                    <ActionRow type="milestone" item={m} h={h} />
                </tr>
            ))}
        </AdminEntityTable>
        <div className="md:hidden space-y-4">{milestones.map(m => <AdminCard key={m.id} image={m.imageUrl} title={`${m.year} — ${m.title}`} subtitle={m.description.slice(0, 80)} status={<Badge>Marco</Badge>} actions={<><Button size="sm" variant="ghost" aria-label="Editar" title="Editar" onClick={() => h.openEditModal('milestone', m)}><Edit2 size={16} /></Button><Button size="sm" variant="ghost" aria-label="Apagar" title="Apagar" className="text-red-400" onClick={() => h.handleDeleteRequest('milestone', m.id, m.title)}><Trash2 size={16} /></Button></>} />)}</div>
    </>
);

export const CategoriesTab: React.FC<EntityHandlers & { categories: Category[] }> = ({ categories, ...h }) => (
    <>
        <AdminEntityTable headers={['Nome', 'Cor', 'Slug']}>
            {categories.map(c => (<tr key={c.id} className="hover:bg-white/5"><td className="p-4 font-bold text-white">{c.name}</td><td className="p-4"><div className={`w-6 h-6 rounded-full ${categoryColorClass(c.color)}`} /></td><td className="p-4 text-slate-500">{c.slug}</td><ActionRow type="category" item={c} h={h} /></tr>))}
        </AdminEntityTable>
        <div className="md:hidden space-y-4">{categories.map(c => <AdminCard key={c.id} title={c.name} subtitle={c.slug} status={<div className={`w-6 h-6 rounded-full ${categoryColorClass(c.color)}`} />} actions={<Button size="sm" variant="ghost" aria-label="Editar" title="Editar" onClick={() => h.openEditModal('category', c)}><Edit2 size={16} /></Button>} />)}</div>
    </>
);

export const TiersTab: React.FC<EntityHandlers & { sponsorTiers: SponsorTier[] }> = ({ sponsorTiers, ...h }) => (
    <>
        <AdminEntityTable headers={['Nível', 'Preço', 'Benefícios']}>
            {sponsorTiers.map(t => (<tr key={t.id} className="hover:bg-white/5"><td className="p-4 font-bold text-white uppercase">{t.name}</td><td className="p-4 text-brand-400">{t.price}</td><td className="p-4 text-slate-500">{t.benefits.length} benefícios</td><ActionRow type="tier" item={t} h={h} /></tr>))}
        </AdminEntityTable>
        <div className="md:hidden space-y-4">{sponsorTiers.map(t => <AdminCard key={t.id} title={t.name} subtitle={t.price} status={<Badge>{t.benefits.length} ben.</Badge>} actions={<><Button size="sm" variant="ghost" aria-label="Editar" title="Editar" onClick={() => h.openEditModal('tier', t)}><Edit2 size={16} /></Button><Button size="sm" variant="ghost" aria-label="Apagar" title="Apagar" className="text-red-400" onClick={() => h.handleDeleteRequest('tier', t.id, t.name)}><Trash2 size={16} /></Button></>} />)}</div>
    </>
);

export const DocumentsTab: React.FC<EntityHandlers & { documents: AppDocument[] }> = ({ documents, ...h }) => (
    <>
        <AdminEntityTable headers={['Documento', 'Categoria', 'Data']}>
            {documents.map(d => (<tr key={d.id} className="hover:bg-white/5"><td className="p-4 font-medium text-white">{d.title}</td><td className="p-4"><Badge>{d.category}</Badge></td><td className="p-4 text-slate-500">{d.date}</td><ActionRow type="document" item={d} h={h} /></tr>))}
        </AdminEntityTable>
        <div className="md:hidden space-y-4">{documents.map(d => <AdminCard key={d.id} title={d.title} subtitle={d.date} status={<Badge>{d.category}</Badge>} actions={<Button size="sm" variant="ghost" aria-label="Editar" title="Editar" onClick={() => h.openEditModal('document', d)}><Edit2 size={16} /></Button>} />)}</div>
    </>
);

export const NotificationsTab: React.FC<EntityHandlers & { notifications: AppNotification[] }> = ({ notifications, ...h }) => (
    <>
        <AdminEntityTable headers={['Título', 'Mensagem', 'Tipo']}>
            {notifications.map(n => (<tr key={n.id} className="hover:bg-white/5"><td className="p-4 font-medium text-white">{n.title}</td><td className="p-4 text-slate-500 max-w-xs truncate">{n.message}</td><td className="p-4"><Badge>{n.type}</Badge></td><ActionRow type="notification" item={n} h={h} /></tr>))}
        </AdminEntityTable>
        <div className="md:hidden space-y-4">{notifications.map(n => <AdminCard key={n.id} title={n.title} subtitle={n.message} status={<Badge>{n.type}</Badge>} actions={<Button size="sm" variant="ghost" aria-label="Editar" title="Editar" onClick={() => h.openEditModal('notification', n)}><Edit2 size={16} /></Button>} />)}</div>
    </>
);

export const GalleryTab: React.FC<EntityHandlers & { albums: Album[] }> = ({ albums, openEditModal, handleDeleteRequest }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
        {albums.map(a => (
            <div key={a.id} className="bg-dark-surface border border-white/10 rounded-xl overflow-hidden group">
                <div className="h-40 overflow-hidden relative">
                    <img src={a.coverUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="glass" onClick={() => openEditModal('album', a)}><Edit2 size={14} className="mr-2" /> Gerir</Button>
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="text-white font-bold truncate">{a.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-500">{a.photos.length} fotos</span>
                        <button onClick={() => handleDeleteRequest('album', a.id, a.title)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const RegistrationModal: React.FC<{ reg: Registration; onClose: () => void; onConfirm: (id: string) => void; onCancel: (id: string) => void }> = ({ reg, onClose, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in-up">
        <div className="bg-dark-surface border border-white/10 rounded-2xl max-w-lg w-full flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                <h3 className="text-white font-bold">Detalhes da Inscrição</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-500 block text-xs">Nome</span> {reg.name ?? "\u2014"}</div>
                    <div><span className="text-slate-500 block text-xs">Email</span> {reg.email ?? "\u2014"}</div>
                    <div><span className="text-slate-500 block text-xs">Data</span> {reg.timestamp ? new Date(reg.timestamp).toLocaleDateString() : "\u2014"}</div>
                    <div><span className="text-slate-500 block text-xs">Estado</span> <Badge className={reg.status === 'confirmed' ? 'bg-green-900/20 text-green-400' : 'bg-amber-900/20 text-amber-400'}>{reg.status}</Badge></div>
                </div>
                <div className="border-t border-white/10 pt-4">
                    <h4 className="text-brand-400 text-xs font-bold uppercase mb-3">Dados Preenchidos</h4>
                    <div className="bg-black/20 rounded-lg p-3 space-y-2">
                        {Object.entries(reg.customData ?? {}).map(([key, val]) => (
                            <div key={key} className="flex justify-between text-sm">
                                <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-white font-medium">{String(val)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-500" onClick={() => onConfirm(reg.id)}>Confirmar</Button>
                    <Button variant="ghost" className="flex-1 text-red-400 hover:text-red-300" onClick={() => onCancel(reg.id)}>Cancelar</Button>
                </div>
            </div>
        </div>
    </div>
);
