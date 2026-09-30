/**
 * Forms for the content entities: events, news, milestones, action areas and
 * albums. Rendered by AdminFormModal inside the shared dialog shell.
 */

import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { AdminSelect } from '../components/AdminSelect';
import { ICON_MAP, STD_INPUT_CLASS, LABEL_CLASS } from '../constants';
import { RichTextEditor } from '../editors/RichTextEditor';
import { MediaStudio } from '../editors/MediaStudio';
import { RegistrationFormBuilder } from '../editors/RegistrationFormBuilder';
import type { AdminFormData, AdminFormModalProps } from '../types';
import type { FieldHelpers, NumHelper } from './types';
import { Field } from '../components/Field';

/** A record may still hold a category that no longer exists; list it so the select does not lie. */
const CategoryOptions: React.FC<{ categories: AdminFormModalProps['categories']; current: string }> = ({ categories, current }) => (
    <>
        {current && !categories.some(c => c.id === current) && <option value={current}>Categoria atual (já não existe)</option>}
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </>
);

// ── Event Form ──────────────────────────────────────────────────────────────

interface EventFormProps extends FieldHelpers, NumHelper {
    formData: AdminFormData;
    bool: (key: string) => boolean;
    categories: Array<{ id: string; name: string }>;
    settings: { defaultImageStyle: string };
    isGeneratingImage: boolean;
    isEnhancingText: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
    onEnhanceText: AdminFormModalProps['onEnhanceText'];
    onFormDataChange: (data: AdminFormData) => void;
}

/** Suggestions only: each association writes the games it actually plays. */
const TOURNAMENT_SUGGESTIONS = ['Sueca', 'Futsal', 'Snooker', 'Xadrez', 'Petanca', 'Chinquilho', 'Padel', 'Dardos', 'Atletismo'];

export const EventForm: React.FC<EventFormProps> = ({
    formData, setField, str, num, bool, categories, settings,
    isGeneratingImage, isEnhancingText, onGenerateImage, onEnhanceText, onFormDataChange,
}) => {
    // Stored as a number, edited as a string: show whichever the record currently holds
    const numStr = (key: string) => str(key) || (Number.isNaN(num(key, NaN)) ? '' : String(num(key, NaN)));
    return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
            <Field label="Título"><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></Field>
            <Field label="Categoria"><AdminSelect value={str('categoryId')} onChange={e => setField('categoryId', e.target.value)}><CategoryOptions categories={categories} current={str('categoryId')} /></AdminSelect></Field>
            <Field label="Data"><input type="datetime-local" value={str('date')} onChange={e => setField('date', e.target.value)} className={STD_INPUT_CLASS} required /></Field>
            <Field label="Estado"><AdminSelect value={str('status', 'published')} onChange={e => setField('status', e.target.value)}>
                    <option value="published">Publicado</option>
                    <option value="draft">Rascunho</option>
                </AdminSelect></Field>
            <MediaStudio label="Cartaz ou imagem" imageUrl={str('imageUrl')} onChange={(url: string) => setField('imageUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} defaultStyle={settings.defaultImageStyle} />
        </div>
        <div className="md:col-span-2 space-y-6">
            <RichTextEditor label="Descrição do evento" required value={str('description')} onChange={(v: string) => setField('description', v)} onEnhance={onEnhanceText} isEnhancing={isEnhancingText} height="h-64" />
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2"><SettingsIcon size={16} /> Local, destaque e tipo</h4>
                <Field label="Local"><input required value={str('location')} onChange={e => setField('location', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: Pavilhão da associação" /></Field>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-brand-500 w-4 h-4" checked={bool('isHighlight')} onChange={e => setField('isHighlight', e.target.checked)} />
                        <span className="text-sm text-slate-300">Mostrar em destaque na página inicial</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-brand-500 w-4 h-4" checked={bool('isTournament')} onChange={e => setField('isTournament', e.target.checked)} />
                        <span className="text-sm text-slate-300">É um torneio</span>
                    </label>
                </div>
                {bool('isTournament') && (
                    <>
                        <Field label="Modalidade" hint="Escreva livremente ou escolha uma sugestão."><input list="tournament-kinds" value={str('tournamentType')} onChange={e => setField('tournamentType', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: Sueca, Futsal, Xadrez" /></Field>
                        <datalist id="tournament-kinds">
                            {TOURNAMENT_SUGGESTIONS.map(kind => <option key={kind} value={kind} />)}
                        </datalist>
                    </>
                )}
            </div>
            {/* Everything about registrations in one place, shown only when they are on */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-5">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="accent-brand-500 w-5 h-5 mt-0.5" checked={bool('registrationOpen')} onChange={e => setField('registrationOpen', e.target.checked)} />
                    <span>
                        <span className="block text-sm font-bold text-white">Aceitar inscrições pelo site</span>
                        <span className="block text-xs text-slate-400">As inscrições chegam ao separador Inscrições, onde as confirma, cancela e exporta.</span>
                    </span>
                </label>
                {bool('registrationOpen') && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Lugares disponíveis" hint="Vazio = sem limite. Quando enchem, o site mostra “Esgotado”."><input type="number" min="1" inputMode="numeric" value={numStr('maxParticipants')} onChange={e => setField('maxParticipants', e.target.value)} className={STD_INPUT_CLASS} /></Field>
                            <Field label="Preço por pessoa (€)" hint="Vazio ou 0 = grátis. O pagamento combina-se com a organização."><input type="number" min="0" step="0.5" inputMode="decimal" value={numStr('entryPrice')} onChange={e => setField('entryPrice', e.target.value)} className={STD_INPUT_CLASS} /></Field>
                        </div>
                        <label className="flex items-start gap-2 cursor-pointer rounded-lg border border-white/10 bg-black/20 p-3">
                            <input type="checkbox" className="accent-brand-500 w-4 h-4 mt-0.5" checked={formData.allowGuestRegistration === false} onChange={e => setField('allowGuestRegistration', !e.target.checked)} />
                            <span className="text-sm text-slate-300">
                                Só sócios com conta se podem inscrever
                                <span className="block text-xs text-slate-400">Desligado (recomendado): quem abre o evento num link do WhatsApp inscreve-se só com nome e email.</span>
                            </span>
                        </label>
                        <RegistrationFormBuilder
                            fields={Array.isArray(formData.registrationFields) ? formData.registrationFields as Array<{ id: string; label: string; type: string; required: boolean; placeholder?: string }> : []}
                            onChange={fields => onFormDataChange({ ...formData, registrationFields: fields })}
                        />
                    </>
                )}
            </div>
        </div>
    </div>
);
};


// ── Post Form ───────────────────────────────────────────────────────────────

interface PostFormProps extends FieldHelpers {
    formData: AdminFormData;
    bool: (key: string) => boolean;
    categories: Array<{ id: string; name: string }>;
    settings: { defaultImageStyle: string };
    isGeneratingImage: boolean;
    isEnhancingText: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
    onEnhanceText: AdminFormModalProps['onEnhanceText'];
    onFormDataChange: (data: AdminFormData) => void;
}

export const PostForm: React.FC<PostFormProps> = ({
    formData, setField, str, bool, categories, settings,
    isGeneratingImage, isEnhancingText, onGenerateImage, onEnhanceText,
}) => {
    const tagsValue = Array.isArray(formData.tags)
        ? (formData.tags as string[]).join(', ')
        : str('tags');

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <Field label="Título"><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></Field>
                <Field label="Categoria"><AdminSelect value={str('categoryId')} onChange={e => setField('categoryId', e.target.value)}><CategoryOptions categories={categories} current={str('categoryId')} /></AdminSelect></Field>
                <Field label="Data"><input type="datetime-local" value={str('date')} onChange={e => setField('date', e.target.value)} className={STD_INPUT_CLASS} required /></Field>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="post-published" className="accent-brand-500 w-4 h-4" checked={bool('published')} onChange={e => setField('published', e.target.checked)} />
                    <label htmlFor="post-published" className="text-sm text-slate-300">Publicada (visível no site)</label>
                </div>
                <MediaStudio label="Imagem de capa" imageUrl={str('coverUrl')} onChange={(url: string) => setField('coverUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} defaultStyle={settings.defaultImageStyle} />
            </div>
            <div className="md:col-span-2 space-y-6">
                <RichTextEditor label="Notícia" value={str('content')} onChange={(v: string) => setField('content', v)} onEnhance={onEnhanceText} isEnhancing={isEnhancingText} height="h-96" />
                {/* Optional details most news never needs, folded so the article comes first */}
                <details className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded">Mais opções: autor e palavras-chave</summary>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Autor" hint="Vazio mostra “Direção”."><input value={str('author')} onChange={e => setField('author', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: Direção" /></Field>
                        <Field label="Cargo do autor"><input value={str('authorRole')} onChange={e => setField('authorRole', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: Presidente" /></Field>
                        <Field label="Tempo de leitura"><input value={str('readTime')} onChange={e => setField('readTime', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: 3 min" /></Field>
                        <Field label="Palavras-chave (opcional)" hint="Separadas por vírgulas."><input value={tagsValue} onChange={e => setField('tags', e.target.value)} className={STD_INPUT_CLASS} placeholder="Festa, Torneio, Juventude" /></Field>
                    </div>
                </details>
            </div>
        </div>
    );
};

// ── Milestone Form ──────────────────────────────────────────────────────────

interface MilestoneFormProps extends FieldHelpers, NumHelper {
    isGeneratingImage: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
}

export const MilestoneForm: React.FC<MilestoneFormProps> = ({ str, num, setField, isGeneratingImage, onGenerateImage }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ano"><input type="number" required value={num('year', new Date().getFullYear())} onChange={e => setField('year', parseInt(e.target.value) || new Date().getFullYear())} className={STD_INPUT_CLASS} /></Field>
                <Field label="Ordem na Timeline"><input type="number" value={num('order', 1)} onChange={e => setField('order', parseInt(e.target.value) || 1)} className={STD_INPUT_CLASS} /></Field>
            </div>
            <Field label="Título"><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: A Fundação" /></Field>
            <Field label="Descrição"><textarea required value={str('description')} onChange={e => setField('description', e.target.value)} className={cn(STD_INPUT_CLASS, 'h-40')} placeholder="O que aconteceu neste marco da história da associação..." /></Field>
        </div>
        <MediaStudio imageUrl={str('imageUrl')} onChange={(url: string) => setField('imageUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} defaultStyle="Historical documentary photo, warm tones, community" />
    </div>
);

// ── Action Area Form ────────────────────────────────────────────────────────

interface ActionAreaFormProps extends FieldHelpers, NumHelper {
    formData: AdminFormData;
    isGeneratingImage: boolean;
    isEnhancingText: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
    onEnhanceText: AdminFormModalProps['onEnhanceText'];
    onFormDataChange: (data: AdminFormData) => void;
}

export const ActionAreaForm: React.FC<ActionAreaFormProps> = ({
    formData, setField, str, num,
    isGeneratingImage, isEnhancingText, onGenerateImage, onEnhanceText, onFormDataChange,
}) => {
    const features = Array.isArray(formData.features) ? (formData.features as string[]) : [];
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Título"><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></Field>
                <Field label="Subtítulo"><input required value={str('subtitle')} onChange={e => setField('subtitle', e.target.value)} className={STD_INPUT_CLASS} /></Field>
            </div>
            <Field label="Descrição Curta (Grid)"><textarea required value={str('description')} onChange={e => setField('description', e.target.value)} className={cn(STD_INPUT_CLASS, 'h-20')} /></Field>
            <RichTextEditor label="Descrição Longa (Modal)" value={str('longDescription')} onChange={(v: string) => setField('longDescription', v)} onEnhance={onEnhanceText} isEnhancing={isEnhancingText} height="h-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ícone"><AdminSelect value={str('iconName', 'Users')} onChange={e => setField('iconName', e.target.value)}>
                        {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </AdminSelect></Field>
                <Field label="Ordem de Exibição"><input type="number" value={num('order')} onChange={e => setField('order', parseInt(e.target.value))} className={STD_INPUT_CLASS} /></Field>
            </div>
            <MediaStudio imageUrl={str('imageUrl')} onChange={(url: string) => setField('imageUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} />
            <Field label="Funcionalidades (Uma por linha)"><textarea className={cn(STD_INPUT_CLASS, 'h-32')} value={features.join('\n')} onChange={e => onFormDataChange({ ...formData, features: e.target.value.split('\n') })} placeholder={'Gestão do Bar\nSala de Jogos...'} /></Field>
        </div>
    );
};

// ── Album Form ──────────────────────────────────────────────────────────────

interface AlbumFormProps extends FieldHelpers {
    isGeneratingImage: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
}

// Album metadata only: photos (upload, captions, order, cover pick) are
// managed in the Galeria tab by AdminGalleryManager
export const AlbumForm: React.FC<AlbumFormProps> = ({ str, setField, isGeneratingImage, onGenerateImage }) => (
    <div className="space-y-6">
        <Field label="Título do Álbum"><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></Field>
        <Field label="Data"><input type="date" value={str('date')} onChange={e => setField('date', e.target.value)} className={STD_INPUT_CLASS} /></Field>
        <Field label="Descrição (opcional)"><textarea rows={3} value={str('description')} onChange={e => setField('description', e.target.value)} className={STD_INPUT_CLASS} placeholder="Uma frase sobre o evento ou a ocasião" /></Field>
        <div>
            <span className={LABEL_CLASS}>Capa (opcional)</span>
            <p className="text-xs text-slate-400 mb-2">Podes também escolher a capa entre as fotos do álbum, na tab Galeria (estrela).</p>
            <MediaStudio imageUrl={str('coverUrl')} onChange={(url: string) => setField('coverUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} />
        </div>
    </div>
);
