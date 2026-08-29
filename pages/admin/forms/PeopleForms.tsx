/**
 * Forms for people and partnerships: members, sponsors, partnership tiers and
 * the categories that colour the public listings.
 */

import React from 'react';
import { cn } from '../../../utils/cn';
import { AdminSelect } from '../components/AdminSelect';
import { STD_INPUT_CLASS, LABEL_CLASS } from '../constants';
import { MediaStudio } from '../editors/MediaStudio';
import { CATEGORY_COLORS, categoryColorClass } from '../../../utils/categoryColors';
import { resolveSponsorTier } from '../../../utils/sponsorTiers';
import type { AdminFormData, AdminFormModalProps } from '../types';
import type { FieldHelpers, NumHelper } from './types';

// ── Member Form ─────────────────────────────────────────────────────────────

interface MemberFormProps extends FieldHelpers, NumHelper {
    formData: AdminFormData;
    isGeneratingImage: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
    onFormDataChange: (data: AdminFormData) => void;
}

export const MemberForm: React.FC<MemberFormProps> = ({ setField, str, num, isGeneratingImage, onGenerateImage }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <MediaStudio imageUrl={str('photoUrl')} onChange={(url: string) => setField('photoUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} defaultStyle="Professional portrait, office setting" />
        </div>
        <div className="space-y-6">
            <div><label className={LABEL_CLASS}>Nome</label><input required value={str('name')} onChange={e => setField('name', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div><label className={LABEL_CLASS}>Cargo</label><input required value={str('role')} onChange={e => setField('role', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div>
                <label className={LABEL_CLASS}>Grupo</label>
                <AdminSelect value={str('group', 'Direção')} onChange={e => setField('group', e.target.value)}>
                    <option value="Direção">Direção</option>
                    <option value="Assembleia Geral">Assembleia Geral</option>
                    <option value="Conselho Fiscal">Conselho Fiscal</option>
                    <option value="founder">Sócio Fundador (página História)</option>
                </AdminSelect>
            </div>
            <div><label className={LABEL_CLASS}>Ordem</label><input type="number" value={num('order', 1)} onChange={e => setField('order', parseInt(e.target.value))} className={STD_INPUT_CLASS} /></div>
        </div>
    </div>
);

// ── Sponsor Form ────────────────────────────────────────────────────────────

interface SponsorFormProps extends FieldHelpers {
    formData: AdminFormData;
    sponsorTiers: Array<{ id: string; name: string }>;
    isGeneratingImage: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
    onFormDataChange: (data: AdminFormData) => void;
}

export const SponsorForm: React.FC<SponsorFormProps> = ({ formData, str, setField, sponsorTiers, isGeneratingImage, onGenerateImage }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <MediaStudio imageUrl={str('logoUrl')} onChange={(url: string) => setField('logoUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} defaultStyle="Corporate logo, vector style" />
        <div className="space-y-6">
            <div><label className={LABEL_CLASS}>Nome</label><input required value={str('name')} onChange={e => setField('name', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div><label className={LABEL_CLASS}>Website</label><input value={str('website')} onChange={e => setField('website', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div>
                <label className={LABEL_CLASS}>Nível</label>
                <AdminSelect value={resolveSponsorTier(sponsorTiers, str('tier'))?.id ?? String(sponsorTiers[0]?.id ?? '')} onChange={e => setField('tier', e.target.value)}>
                    {sponsorTiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </AdminSelect>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="sponsor-active" className="accent-brand-500 w-4 h-4" checked={formData.active !== false} onChange={e => setField('active', e.target.checked)} />
                <label htmlFor="sponsor-active" className="text-sm text-slate-300">Ativo (visível no portal)</label>
            </div>
        </div>
    </div>
);

// ── Tier Form ───────────────────────────────────────────────────────────────

export const TierForm: React.FC<FieldHelpers & NumHelper> = ({ str, num, setField }) => (
    <div className="space-y-6">
        <div><label className={LABEL_CLASS}>Nome do Nível</label><input required value={str('name')} onChange={e => setField('name', e.target.value)} className={STD_INPUT_CLASS} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={LABEL_CLASS}>Preço Display</label><input required value={str('price')} onChange={e => setField('price', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div><label className={LABEL_CLASS}>Ordem de Exibição</label><input type="number" value={num('order', 1)} onChange={e => setField('order', parseInt(e.target.value) || 1)} className={STD_INPUT_CLASS} /></div>
        </div>
        <div>
            <label className={LABEL_CLASS}>Benefícios (Um por linha)</label>
            <textarea className={cn(STD_INPUT_CLASS, 'h-40')} value={str('benefits')} onChange={e => setField('benefits', e.target.value)} placeholder={'Logótipo no site\nMenção no evento...'} />
        </div>
    </div>
);

// ── Category Form ───────────────────────────────────────────────────────────

export const CategoryForm: React.FC<FieldHelpers> = ({ str, setField }) => (
    <div className="space-y-6">
        <div><label className={LABEL_CLASS}>Nome</label><input required value={str('name')} onChange={e => setField('name', e.target.value)} className={STD_INPUT_CLASS} /></div>
        <div>
            <label className={LABEL_CLASS}>Cor da categoria</label>
            <div className="flex flex-wrap gap-2.5">
                {CATEGORY_COLORS.map(color => {
                    const selected = categoryColorClass(str('color', 'bg-brand-500')) === color.value;
                    return (
                        <button
                            key={color.value}
                            type="button"
                            onClick={() => setField('color', color.value)}
                            aria-label={color.label}
                            aria-pressed={selected}
                            title={color.label}
                            className={cn(
                                'w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-slate-900 transition-transform focus-visible:outline-none focus-visible:ring-brand-500',
                                color.value,
                                selected ? 'ring-white scale-110' : 'ring-transparent hover:scale-105',
                            )}
                        />
                    );
                })}
            </div>
        </div>
    </div>
);
