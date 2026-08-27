
import React, { useEffect, useRef } from 'react';
import { Plus, Edit2, X, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../../components/ui/UIComponents';
import { cn } from '../../utils/cn';
import { AdminSelect } from './components/AdminSelect';
import { ICON_MAP, STD_INPUT_CLASS, LABEL_CLASS } from './constants';
import { RichTextEditor } from './editors/RichTextEditor';
import { MediaStudio } from './editors/MediaStudio';
import { RegistrationFormBuilder } from './editors/RegistrationFormBuilder';
import type { AdminFormModalProps, AdminFormData } from './types';

/**
 * Master modal for creating/editing all entity types.
 * Renders the appropriate form fields based on the active modal type.
 */
export const AdminFormModal: React.FC<AdminFormModalProps> = ({
    showModal,
    editingId,
    editingTierId,
    formData,
    isSubmitting,
    isGeneratingImage,
    isEnhancingText,
    categories,
    sponsorTiers,
    settings,
    onFormDataChange,
    onSubmit,
    onClose,
    onGenerateImage,
    onEnhanceText,
}) => {
    // Esc closes the modal, matching the shared Modal component. onClose
    // lives in a ref so the listener never re-binds while typing.
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; });
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    /** Type-safe field updater for the form data record */
    const setField = (key: string, value: unknown) => {
        onFormDataChange({ ...formData, [key]: value });
    };

    /** Read a string field with fallback */
    const str = (key: string, fallback = ''): string => {
        const v = formData[key];
        return typeof v === 'string' ? v : fallback;
    };

    /** Read a number field */
    const num = (key: string, fallback = 0): number => {
        const v = formData[key];
        return typeof v === 'number' ? v : fallback;
    };

    /** Read a boolean field */
    const bool = (key: string): boolean => {
        return formData[key] === true;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-0 md:p-4">
            <div className="bg-dark-surface border-0 md:border border-white/10 w-full h-full md:h-[90vh] md:max-w-4xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-dark-surface z-10 shrink-0 safe-top">
                    <h3 className="text-lg font-serif text-white flex items-center gap-2">
                        {editingId || editingTierId
                            ? <Edit2 size={18} className="text-brand-400" />
                            : <Plus size={18} className="text-brand-400" />}
                        {editingId || editingTierId ? 'Editar' : 'Criar'}
                    </h3>
                    <button onClick={onClose} aria-label="Fechar" className="p-2 text-slate-400 bg-white/5 rounded-full hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-24 space-y-6">
                    {showModal === 'event' && (
                        <EventForm
                            formData={formData} setField={setField} str={str} num={num} bool={bool}
                            categories={categories} settings={settings}
                            isGeneratingImage={isGeneratingImage} isEnhancingText={isEnhancingText}
                            onGenerateImage={onGenerateImage} onEnhanceText={onEnhanceText}
                            onFormDataChange={onFormDataChange}
                        />
                    )}
                    {showModal === 'post' && (
                        <PostForm
                            formData={formData} setField={setField} str={str} bool={bool}
                            categories={categories} settings={settings}
                            isGeneratingImage={isGeneratingImage} isEnhancingText={isEnhancingText}
                            onGenerateImage={onGenerateImage} onEnhanceText={onEnhanceText}
                            onFormDataChange={onFormDataChange}
                        />
                    )}
                    {showModal === 'member' && (
                        <MemberForm formData={formData} setField={setField} str={str} num={num} isGeneratingImage={isGeneratingImage} onGenerateImage={onGenerateImage} onFormDataChange={onFormDataChange} />
                    )}
                    {showModal === 'category' && <CategoryForm str={str} setField={setField} />}
                    {showModal === 'sponsor' && (
                        <SponsorForm formData={formData} str={str} setField={setField} sponsorTiers={sponsorTiers} isGeneratingImage={isGeneratingImage} onGenerateImage={onGenerateImage} onFormDataChange={onFormDataChange} />
                    )}
                    {showModal === 'tier' && <TierForm str={str} num={num} setField={setField} />}
                    {showModal === 'document' && <DocumentForm str={str} setField={setField} />}
                    {showModal === 'notification' && <NotificationForm str={str} setField={setField} />}
                    {showModal === 'actionArea' && (
                        <ActionAreaForm
                            formData={formData} setField={setField} str={str} num={num}
                            isGeneratingImage={isGeneratingImage} isEnhancingText={isEnhancingText}
                            onGenerateImage={onGenerateImage} onEnhanceText={onEnhanceText}
                            onFormDataChange={onFormDataChange}
                        />
                    )}
                    {showModal === 'stat' && <StatForm str={str} num={num} setField={setField} />}
                    {showModal === 'milestone' && (
                        <MilestoneForm str={str} num={num} setField={setField} isGeneratingImage={isGeneratingImage} onGenerateImage={onGenerateImage} />
                    )}
                    {showModal === 'album' && (
                        <AlbumForm
                            str={str} setField={setField}
                            isGeneratingImage={isGeneratingImage} onGenerateImage={onGenerateImage}
                        />
                    )}
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-dark-surface shrink-0 safe-bottom">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSubmit} disabled={isSubmitting} className="bg-brand-600 hover:bg-brand-500 shadow-lg min-w-[120px]">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Guardar Alterações'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ── Shared field helpers type ────────────────────────────────────────────────

interface FieldHelpers {
    str: (key: string, fallback?: string) => string;
    setField: (key: string, value: unknown) => void;
}

interface NumHelper {
    num: (key: string, fallback?: number) => number;
}

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

const EventForm: React.FC<EventFormProps> = ({
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

const PostForm: React.FC<PostFormProps> = ({
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

// ── Member Form ─────────────────────────────────────────────────────────────

interface MemberFormProps extends FieldHelpers, NumHelper {
    formData: AdminFormData;
    isGeneratingImage: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
    onFormDataChange: (data: AdminFormData) => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ setField, str, num, isGeneratingImage, onGenerateImage }) => (
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

// ── Category Form ───────────────────────────────────────────────────────────

const CategoryForm: React.FC<FieldHelpers> = ({ str, setField }) => (
    <div className="space-y-6">
        <div><label className={LABEL_CLASS}>Nome</label><input required value={str('name')} onChange={e => setField('name', e.target.value)} className={STD_INPUT_CLASS} /></div>
        <div>
            <label className={LABEL_CLASS}>Cor (Tailwind Class)</label>
            <AdminSelect value={str('color', 'bg-brand-500')} onChange={e => setField('color', e.target.value)}>
                <option value="bg-brand-500">Azul Marca</option>
                <option value="bg-green-500">Verde</option>
                <option value="bg-red-500">Vermelho</option>
                <option value="bg-yellow-500">Amarelo</option>
                <option value="bg-purple-500">Roxo</option>
                <option value="bg-pink-500">Rosa</option>
                <option value="bg-slate-500">Cinzento</option>
            </AdminSelect>
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

const SponsorForm: React.FC<SponsorFormProps> = ({ formData, str, setField, sponsorTiers, isGeneratingImage, onGenerateImage }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <MediaStudio imageUrl={str('logoUrl')} onChange={(url: string) => setField('logoUrl', url)} onGenerateAI={onGenerateImage} isGenerating={isGeneratingImage} defaultStyle="Corporate logo, vector style" />
        <div className="space-y-6">
            <div><label className={LABEL_CLASS}>Nome</label><input required value={str('name')} onChange={e => setField('name', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div><label className={LABEL_CLASS}>Website</label><input value={str('website')} onChange={e => setField('website', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div>
                <label className={LABEL_CLASS}>Nível</label>
                <AdminSelect value={str('tier', 'Silver')} onChange={e => setField('tier', e.target.value)}>
                    {sponsorTiers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
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

const TierForm: React.FC<FieldHelpers & NumHelper> = ({ str, num, setField }) => (
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

// ── Document Form ───────────────────────────────────────────────────────────

const DocumentForm: React.FC<FieldHelpers> = ({ str, setField }) => (
    <div className="space-y-6">
        <div><label className={LABEL_CLASS}>Título</label><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></div>
        <div>
            <label className={LABEL_CLASS}>Categoria</label>
            <AdminSelect value={str('category', 'Outros')} onChange={e => setField('category', e.target.value)}>
                <option value="Atas">Atas</option>
                <option value="Relatórios">Relatórios</option>
                <option value="Estatutos">Estatutos</option>
                <option value="Regulamentos">Regulamentos</option>
                <option value="Outros">Outros</option>
            </AdminSelect>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={LABEL_CLASS}>URL do Ficheiro</label><input value={str('url')} onChange={e => setField('url', e.target.value)} className={STD_INPUT_CLASS} placeholder="https://..." /></div>
            <div><label className={LABEL_CLASS}>Tamanho (Ex: 2 MB)</label><input value={str('size')} onChange={e => setField('size', e.target.value)} className={STD_INPUT_CLASS} placeholder="1.5 MB" /></div>
        </div>
    </div>
);

// ── Notification Form ───────────────────────────────────────────────────────

const NotificationForm: React.FC<FieldHelpers> = ({ str, setField }) => (
    <div className="space-y-6">
        <div><label className={LABEL_CLASS}>Título</label><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></div>
        <div><label className={LABEL_CLASS}>Mensagem</label><textarea required value={str('message')} onChange={e => setField('message', e.target.value)} className={cn(STD_INPUT_CLASS, 'h-24')} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className={LABEL_CLASS}>Tipo</label>
                <AdminSelect value={str('type', 'info')} onChange={e => setField('type', e.target.value)}>
                    <option value="info">Informação</option>
                    <option value="warning">Aviso</option>
                    <option value="urgent">Urgente</option>
                    <option value="success">Sucesso</option>
                </AdminSelect>
            </div>
            <div>
                <label className={LABEL_CLASS}>Destinatários</label>
                <AdminSelect value={str('target', 'all')} onChange={e => setField('target', e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="user">Sócios</option>
                    <option value="admin">Administração</option>
                </AdminSelect>
            </div>
        </div>
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

const ActionAreaForm: React.FC<ActionAreaFormProps> = ({
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

// ── Milestone Form ──────────────────────────────────────────────────────────

interface MilestoneFormProps extends FieldHelpers, NumHelper {
    isGeneratingImage: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({ str, num, setField, isGeneratingImage, onGenerateImage }) => (
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

// ── Stat Form ───────────────────────────────────────────────────────────────

interface StatFormProps extends FieldHelpers, NumHelper {}

const StatForm: React.FC<StatFormProps> = ({ str, num, setField }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2"><label className={LABEL_CLASS}>Rótulo (Ex: Fundada em...)</label><input required value={str('label')} onChange={e => setField('label', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div><label className={LABEL_CLASS}>Valor (Ex: 1982)</label><input required value={str('value')} onChange={e => setField('value', e.target.value)} className={STD_INPUT_CLASS} /></div>
        </div>
        <div><label className={LABEL_CLASS}>Ordem de Exibição</label><input type="number" value={num('order')} onChange={e => setField('order', parseInt(e.target.value))} className={STD_INPUT_CLASS} /></div>
    </div>
);

// ── Album Form ──────────────────────────────────────────────────────────────

interface AlbumFormProps extends FieldHelpers {
    isGeneratingImage: boolean;
    onGenerateImage: AdminFormModalProps['onGenerateImage'];
}

// Album metadata only: photos (upload, captions, order, cover pick) are
// managed in the Galeria tab by AdminGalleryManager
const AlbumForm: React.FC<AlbumFormProps> = ({ str, setField, isGeneratingImage, onGenerateImage }) => (
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
