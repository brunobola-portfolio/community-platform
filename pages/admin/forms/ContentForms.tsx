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

export const EventForm: React.FC<EventFormProps> = ({
    formData, setField, str, bool, categories, settings,
    isGeneratingImage, isEnhancingText, onGenerateImage, onEnhanceText, onFormDataChange,
}) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
            <div><label className={LABEL_CLASS}>Título</label><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div><label className={LABEL_CLASS}>Categoria</label><AdminSelect value={str('categoryId')} onChange={e => setField('categoryId', e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</AdminSelect></div>
            <div><label className={LABEL_CLASS}>Data</label><input type="datetime-local" value={str('date')} onChange={e => setField('date', e.target.value)} className={STD_INPUT_CLASS} required /></div>
            <div>
                <label className={LABEL_CLASS}>Estado</label>
                <AdminSelect value={str('status', 'published')} onChange={e => setField('status', e.target.value)}>
                    <option value="published">Publicado</option>
                    <option value="draft">Rascunho</option>
                </AdminSelect>
            </div>
            <MediaStudio imageUrl={str('imageUrl')} onChange={(url: string) => setField('imageUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} defaultStyle={settings.defaultImageStyle} />
        </div>
        <div className="md:col-span-2 space-y-6">
            <RichTextEditor label="Conteúdo Principal" value={str('description')} onChange={(v: string) => setField('description', v)} onEnhance={onEnhanceText} isEnhancing={isEnhancingText} height="h-64" />
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><SettingsIcon size={16} /> Configurações de Evento</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div><label className={LABEL_CLASS}>Local</label><input value={str('location')} onChange={e => setField('location', e.target.value)} className={STD_INPUT_CLASS} /></div>
                    <div><label className={LABEL_CLASS}>Preço (EUR)</label><input type="number" value={str('entryPrice', '0')} onChange={e => setField('entryPrice', e.target.value)} className={STD_INPUT_CLASS} /></div>
                    <div><label className={LABEL_CLASS}>Máx Participantes</label><input type="number" value={str('maxParticipants', '0')} onChange={e => setField('maxParticipants', e.target.value)} className={STD_INPUT_CLASS} /></div>
                    <div className="flex items-center gap-2 pt-6">
                        <input type="checkbox" className="accent-brand-500 w-4 h-4" checked={bool('isHighlight')} onChange={e => setField('isHighlight', e.target.checked)} />
                        <span className="text-sm text-slate-300">Destaque (Homepage)</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-6 mb-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" className="accent-brand-500 w-4 h-4" checked={bool('isTournament')} onChange={e => setField('isTournament', e.target.checked)} />
                        <span className="text-sm text-slate-300">Modo Torneio</span>
                    </div>
                    {bool('isTournament') && (
                        <div className="flex items-center gap-2">
                            <AdminSelect className="text-xs w-32" value={str('tournamentType', 'Outro')} onChange={e => setField('tournamentType', e.target.value)}>
                                <option value="Sueca">Sueca</option><option value="Futsal">Futsal</option><option value="Snooker">Snooker</option><option value="Chinquilho">Chinquilho</option><option value="Petanca">Petanca</option><option value="Outro">Outro</option>
                            </AdminSelect>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input type="checkbox" className="accent-brand-500 w-4 h-4" checked={bool('registrationOpen')} onChange={e => setField('registrationOpen', e.target.checked)} />
                        <span className="text-sm text-slate-300">Inscrições Abertas</span>
                    </div>
                </div>
                <RegistrationFormBuilder
                    fields={Array.isArray(formData.registrationFields) ? formData.registrationFields as Array<{ id: string; label: string; type: string; required: boolean; placeholder?: string }> : []}
                    onChange={fields => onFormDataChange({ ...formData, registrationFields: fields })}
                />
            </div>
        </div>
    </div>
);

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
                <div><label className={LABEL_CLASS}>Título</label><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></div>
                <div><label className={LABEL_CLASS}>Categoria</label><AdminSelect value={str('categoryId')} onChange={e => setField('categoryId', e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</AdminSelect></div>
                <div><label className={LABEL_CLASS}>Data</label><input type="datetime-local" value={str('date')} onChange={e => setField('date', e.target.value)} className={STD_INPUT_CLASS} required /></div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="post-published" className="accent-brand-500 w-4 h-4" checked={bool('published')} onChange={e => setField('published', e.target.checked)} />
                    <label htmlFor="post-published" className="text-sm text-slate-300">Publicado (visível no portal)</label>
                </div>
                <MediaStudio imageUrl={str('coverUrl')} onChange={(url: string) => setField('coverUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} defaultStyle={settings.defaultImageStyle} />
            </div>
            <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={LABEL_CLASS}>Autor (Nome)</label><input value={str('author')} onChange={e => setField('author', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: Direção" /></div>
                    <div><label className={LABEL_CLASS}>Cargo do Autor</label><input value={str('authorRole')} onChange={e => setField('authorRole', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: Direção" /></div>
                    <div><label className={LABEL_CLASS}>Avatar do Autor (URL)</label><input value={str('authorAvatar')} onChange={e => setField('authorAvatar', e.target.value)} className={STD_INPUT_CLASS} placeholder="https://..." /></div>
                    <div><label className={LABEL_CLASS}>Tempo de Leitura</label><input value={str('readTime')} onChange={e => setField('readTime', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: 5 min" /></div>
                </div>
                <div><label className={LABEL_CLASS}>Tags (Separadas por vírgula)</label><input value={tagsValue} onChange={e => setField('tags', e.target.value)} className={STD_INPUT_CLASS} placeholder="Associação, Comunidade, Evento" /></div>
                <RichTextEditor label="Notícia" value={str('content')} onChange={(v: string) => setField('content', v)} onEnhance={onEnhanceText} isEnhancing={isEnhancingText} height="h-96" />
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
                <div><label className={LABEL_CLASS}>Ano</label><input type="number" required value={num('year', new Date().getFullYear())} onChange={e => setField('year', parseInt(e.target.value) || new Date().getFullYear())} className={STD_INPUT_CLASS} /></div>
                <div><label className={LABEL_CLASS}>Ordem na Timeline</label><input type="number" value={num('order', 1)} onChange={e => setField('order', parseInt(e.target.value) || 1)} className={STD_INPUT_CLASS} /></div>
            </div>
            <div><label className={LABEL_CLASS}>Título</label><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} placeholder="Ex: A Fundação" /></div>
            <div><label className={LABEL_CLASS}>Descrição</label><textarea required value={str('description')} onChange={e => setField('description', e.target.value)} className={cn(STD_INPUT_CLASS, 'h-40')} placeholder="O que aconteceu neste marco da história da associação..." /></div>
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
                <div><label className={LABEL_CLASS}>Título</label><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></div>
                <div><label className={LABEL_CLASS}>Subtítulo</label><input required value={str('subtitle')} onChange={e => setField('subtitle', e.target.value)} className={STD_INPUT_CLASS} /></div>
            </div>
            <div><label className={LABEL_CLASS}>Descrição Curta (Grid)</label><textarea required value={str('description')} onChange={e => setField('description', e.target.value)} className={cn(STD_INPUT_CLASS, 'h-20')} /></div>
            <RichTextEditor label="Descrição Longa (Modal)" value={str('longDescription')} onChange={(v: string) => setField('longDescription', v)} onEnhance={onEnhanceText} isEnhancing={isEnhancingText} height="h-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Ícone</label>
                    <AdminSelect value={str('iconName', 'Users')} onChange={e => setField('iconName', e.target.value)}>
                        {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                    </AdminSelect>
                </div>
                <div><label className={LABEL_CLASS}>Ordem de Exibição</label><input type="number" value={num('order')} onChange={e => setField('order', parseInt(e.target.value))} className={STD_INPUT_CLASS} /></div>
            </div>
            <MediaStudio imageUrl={str('imageUrl')} onChange={(url: string) => setField('imageUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} />
            <div>
                <label className={LABEL_CLASS}>Funcionalidades (Uma por linha)</label>
                <textarea className={cn(STD_INPUT_CLASS, 'h-32')} value={features.join('\n')} onChange={e => onFormDataChange({ ...formData, features: e.target.value.split('\n') })} placeholder={'Gestão do Bar\nSala de Jogos...'} />
            </div>
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
        <div><label className={LABEL_CLASS}>Título do Álbum</label><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></div>
        <div><label className={LABEL_CLASS}>Data</label><input type="date" value={str('date')} onChange={e => setField('date', e.target.value)} className={STD_INPUT_CLASS} /></div>
        <div><label className={LABEL_CLASS}>Descrição (opcional)</label><textarea rows={3} value={str('description')} onChange={e => setField('description', e.target.value)} className={STD_INPUT_CLASS} placeholder="Uma frase sobre o evento ou a ocasião" /></div>
        <div>
            <label className={LABEL_CLASS}>Capa (opcional)</label>
            <p className="text-xs text-slate-500 mb-2">Podes também escolher a capa entre as fotos do álbum, na tab Galeria (estrela).</p>
            <MediaStudio imageUrl={str('coverUrl')} onChange={(url: string) => setField('coverUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} />
        </div>
    </div>
);
