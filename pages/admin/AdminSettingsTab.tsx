
import React from 'react';
import { Globe, MapPin, Facebook, BookOpen, Plus, Trash2, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/UIComponents';
import { AdminSelect } from './components/AdminSelect';
import { STD_INPUT_CLASS, LABEL_CLASS } from './constants';
import type { AdminSettingsTabProps } from './types';
import type { AboutPillar } from '../../types';
import { AdminIdentitySection } from './AdminIdentitySection';

// Icon options must match PILLAR_ICONS in pages/About.tsx
const PILLAR_ICON_OPTIONS = ['Target', 'Shield', 'Users', 'Heart', 'Trophy', 'Handshake', 'Star', 'Sparkles'];
const MAX_PILLARS = 6;

/**
 * Settings tab for general application configuration.
 * Handles site identity, contact info, location, and social media settings.
 */
export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
    settingsForm,
    onSettingsChange,
    onSave,
}) => {
    const update = <K extends keyof typeof settingsForm>(key: K, value: (typeof settingsForm)[K]) => {
        onSettingsChange({ ...settingsForm, [key]: value });
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* General */}
            <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                    <Globe className="text-brand-400" /> Geral
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className={LABEL_CLASS}>Nome do Site</label>
                        <input value={settingsForm.siteName} onChange={e => update('siteName', e.target.value)} className={STD_INPUT_CLASS} />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Email</label>
                        <input value={settingsForm.contactEmail} onChange={e => update('contactEmail', e.target.value)} className={STD_INPUT_CLASS} />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>URL do Logótipo</label>
                        <div className="flex gap-2">
                            <input
                                placeholder="https://... ou /logo.svg"
                                value={settingsForm.logoUrl ?? ''}
                                onChange={e => update('logoUrl', e.target.value)}
                                className={STD_INPUT_CLASS}
                            />
                        </div>
                        {settingsForm.logoUrl && (
                            <div className="mt-2 p-2 bg-black/40 rounded-lg inline-block">
                                <img
                                    src={settingsForm.logoUrl}
                                    alt="Preview"
                                    className="h-8 object-contain"
                                    onError={e => { (e.target as HTMLImageElement).classList.add('hidden'); }}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span>Modo de Manutenção</span>
                        <input
                            type="checkbox"
                            className="accent-brand-500 w-5 h-5"
                            checked={settingsForm.maintenanceMode}
                            onChange={e => update('maintenanceMode', e.target.checked)}
                        />
                    </div>
                </div>
            </div>

            <AdminIdentitySection settingsForm={settingsForm} onChange={update} />

            {/* Contact & Location */}
            <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                    <MapPin className="text-green-400" /> Contacto & Localização
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Telefone</label>
                            <input value={settingsForm.phone ?? ''} onChange={e => update('phone', e.target.value)} className={STD_INPUT_CLASS} placeholder="+351 212 345 678" />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Mandato Atual</label>
                            <input value={settingsForm.currentMandate ?? ''} onChange={e => update('currentMandate', e.target.value)} className={STD_INPUT_CLASS} placeholder="2024-2026" />
                        </div>
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Morada</label>
                        <input value={settingsForm.address ?? ''} onChange={e => update('address', e.target.value)} className={STD_INPUT_CLASS} placeholder="Rua da Associação, 1, 0000-000 Localidade" />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Horário de Funcionamento</label>
                        <input value={settingsForm.openingHours ?? ''} onChange={e => update('openingHours', e.target.value)} className={STD_INPUT_CLASS} placeholder="Seg–Sex: 9:00–18:00 · Sáb–Dom: 13:00–23:00" />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>URL do Google Maps</label>
                        <input value={settingsForm.mapsUrl ?? ''} onChange={e => update('mapsUrl', e.target.value)} className={STD_INPUT_CLASS} placeholder="https://maps.app.goo.gl/..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Latitude</label>
                            <input value={settingsForm.latitude ?? ''} onChange={e => update('latitude', e.target.value)} className={STD_INPUT_CLASS} placeholder="39.515469" />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Longitude</label>
                            <input value={settingsForm.longitude ?? ''} onChange={e => update('longitude', e.target.value)} className={STD_INPUT_CLASS} placeholder="-8.586681" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quota Payments */}
            <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-serif text-white mb-2 flex items-center gap-2">
                    <CreditCard className="text-emerald-400" /> Quotas & Pagamentos
                </h3>
                <p className="text-slate-500 text-sm mb-6">Dados mostrados aos sócios na Área de Sócio. Campos vazios ficam ocultos; sem nenhum configurado, o sócio vê a indicação para contactar a direção.</p>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Valor da Quota</label>
                            <input value={settingsForm.quotaAmount ?? ''} onChange={e => update('quotaAmount', e.target.value)} className={STD_INPUT_CLASS} placeholder="12€ / ano" />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>MB WAY</label>
                            <input value={settingsForm.mbwayNumber ?? ''} onChange={e => update('mbwayNumber', e.target.value)} className={STD_INPUT_CLASS} placeholder="+351 912 345 678" />
                        </div>
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>IBAN</label>
                        <input value={settingsForm.iban ?? ''} onChange={e => update('iban', e.target.value)} className={STD_INPUT_CLASS} placeholder="PT50 0000 0000 0000 0000 0000 0" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Entidade Multibanco</label>
                            <input value={settingsForm.multibancoEntity ?? ''} onChange={e => update('multibancoEntity', e.target.value)} className={STD_INPUT_CLASS} placeholder="12345" />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Referência Multibanco</label>
                            <input value={settingsForm.multibancoReference ?? ''} onChange={e => update('multibancoReference', e.target.value)} className={STD_INPUT_CLASS} placeholder="123 456 789" />
                        </div>
                    </div>
                </div>
            </div>

            {/* About Page Content */}
            <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                    <BookOpen className="text-amber-400" /> Página Sobre
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className={LABEL_CLASS}>Missão (parágrafo de destaque)</label>
                        <textarea
                            rows={3}
                            value={settingsForm.aboutMission ?? ''}
                            onChange={e => update('aboutMission', e.target.value)}
                            className={STD_INPUT_CLASS}
                            placeholder="A associação promove a vida recreativa, cultural e desportiva da comunidade..."
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Pilares (cartões da secção de valores)</label>
                        <div className="space-y-3">
                            {(settingsForm.aboutPillars ?? []).map((pillar, i) => {
                                const setPillar = (patch: Partial<AboutPillar>) => {
                                    const next = [...(settingsForm.aboutPillars ?? [])];
                                    next[i] = { ...next[i], ...patch };
                                    update('aboutPillars', next);
                                };
                                return (
                                    <div key={i} className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
                                        <div className="flex gap-3">
                                            <AdminSelect
                                                value={pillar.icon}
                                                aria-label="Ícone do pilar"
                                                onChange={e => setPillar({ icon: e.target.value })}
                                                className="w-40"
                                            >
                                                {PILLAR_ICON_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
                                            </AdminSelect>
                                            <input
                                                value={pillar.title}
                                                aria-label="Título do pilar"
                                                onChange={e => setPillar({ title: e.target.value })}
                                                className={STD_INPUT_CLASS}
                                                placeholder="Título"
                                            />
                                            <button
                                                type="button"
                                                aria-label="Remover pilar"
                                                onClick={() => update('aboutPillars', (settingsForm.aboutPillars ?? []).filter((_, idx) => idx !== i))}
                                                className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-brand-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={pillar.description}
                                            aria-label="Descrição do pilar"
                                            onChange={e => setPillar({ description: e.target.value })}
                                            className={STD_INPUT_CLASS}
                                            placeholder="Descrição"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        {(settingsForm.aboutPillars ?? []).length < MAX_PILLARS && (
                            <button
                                type="button"
                                onClick={() => update('aboutPillars', [...(settingsForm.aboutPillars ?? []), { icon: 'Target', title: '', description: '' }])}
                                className="mt-3 flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg px-2 py-1"
                            >
                                <Plus size={16} /> Adicionar pilar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Social Media */}
            <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                    <Facebook className="text-blue-400" /> Redes Sociais
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className={LABEL_CLASS}>Facebook Page ID</label>
                        <input value={settingsForm.facebookPageId ?? ''} onChange={e => update('facebookPageId', e.target.value)} className={STD_INPUT_CLASS} placeholder="ID da página do Facebook" />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Facebook Access Token</label>
                        <input type="password" value={settingsForm.facebookAccessToken ?? ''} onChange={e => update('facebookAccessToken', e.target.value)} className={STD_INPUT_CLASS} placeholder="Token de acesso (mantido seguro)" />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Instagram (URL)</label>
                        <input value={settingsForm.instagramUrl ?? ''} onChange={e => update('instagramUrl', e.target.value)} className={STD_INPUT_CLASS} placeholder="https://www.instagram.com/a-tua-associacao/" />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end sticky bottom-0 bg-dark-bg p-4 z-10 border-t border-white/10">
                <Button onClick={onSave}>Guardar Alterações</Button>
            </div>
        </div>
    );
};
