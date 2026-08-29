
import React, { useRef, useState } from 'react';
import { Plus, Edit2, Loader2, Save, AlertTriangle } from 'lucide-react';
import { Button, Modal } from '../../components/ui/UIComponents';
import type { AdminFormModalProps } from './types';
import { EventForm, PostForm, MilestoneForm, ActionAreaForm, AlbumForm } from './forms/ContentForms';
import { MemberForm, SponsorForm, TierForm, CategoryForm } from './forms/PeopleForms';
import { DocumentForm, NotificationForm, StatForm } from './forms/SystemForms';


/** Human labels for the dialog header, one per entity the form can edit. */
const ENTITY_LABELS: Record<string, { singular: string; article: string; hint?: string }> = {
    event: { singular: 'evento', article: 'o', hint: 'Aparece na agenda pública. Guarde como rascunho para preparar sem publicar.' },
    post: { singular: 'notícia', article: 'a', hint: 'Só as notícias publicadas aparecem no portal.' },
    member: { singular: 'membro', article: 'o', hint: 'Mostrado na página Equipa, pela ordem definida.' },
    category: { singular: 'categoria', article: 'a', hint: 'Nome e cor usados por eventos e notícias.' },
    sponsor: { singular: 'parceiro', article: 'o', hint: 'Aparece na faixa de apoios da página inicial.' },
    tier: { singular: 'nível de parceria', article: 'o', hint: 'Proposto no formulário de parcerias do portal.' },
    document: { singular: 'documento', article: 'o', hint: 'Disponibilizado aos sócios na área reservada.' },
    notification: { singular: 'notificação', article: 'a', hint: 'Enviada aos sócios com sessão iniciada.' },
    actionArea: { singular: 'área de atuação', article: 'a', hint: 'Bloco em destaque na página inicial.' },
    stat: { singular: 'número em destaque', article: 'o', hint: 'Faixa de números da página inicial.' },
    milestone: { singular: 'marco histórico', article: 'o', hint: 'Ponto da linha do tempo da página História.' },
    album: { singular: 'álbum', article: 'o', hint: 'As fotografias adicionam-se depois, no gestor de galeria.' },
};
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

    // Snapshot on open so closing with pending edits can warn instead of
    // silently throwing the work away
    const initialSnapshot = useRef(JSON.stringify(formData));
    const isDirty = JSON.stringify(formData) !== initialSnapshot.current;
    const [askDiscard, setAskDiscard] = useState(false);
    const requestClose = () => (isDirty ? setAskDiscard(true) : onClose());

    const isEditing = Boolean(editingId || editingTierId);
    const entity = ENTITY_LABELS[showModal] ?? { singular: 'registo', article: 'o' };

    return (
        <>
            <Modal
                isOpen
                onClose={requestClose}
                title={`${isEditing ? 'Editar' : 'Criar'} ${entity.singular}`}
                eyebrow={isEditing ? 'A editar um registo existente' : 'Novo registo'}
                description={entity.hint}
                icon={isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                size="xl"
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <span className="mr-auto hidden text-xs text-slate-500 sm:block">
                            {isDirty ? 'Alterações por guardar' : 'Sem alterações por guardar'}
                        </span>
                        <Button type="button" variant="ghost" onClick={requestClose} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" form="admin-entity-form" disabled={isSubmitting} className="min-w-[160px]">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={16} /> Guardar</>}
                        </Button>
                    </div>
                }
            >
                <form id="admin-entity-form" onSubmit={onSubmit} className="space-y-6">
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
            </Modal>

            {askDiscard && (
                <Modal
                    isOpen
                    onClose={() => setAskDiscard(false)}
                    title="Descartar alterações?"
                    eyebrow="Alterações por guardar"
                    description="Fechou o formulário com alterações que ainda não foram guardadas."
                    icon={<AlertTriangle size={20} />}
                    size="sm"
                    footer={
                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1" onClick={() => setAskDiscard(false)}>Continuar a editar</Button>
                            <Button className="flex-1 border-red-500/50 bg-red-600 hover:bg-red-500" onClick={() => { setAskDiscard(false); onClose(); }}>Descartar</Button>
                        </div>
                    }
                >
                    <p className="text-sm leading-relaxed text-slate-400">
                        Se descartar, os dados introduzidos perdem-se e o registo fica como estava.
                    </p>
                </Modal>
            )}
        </>
    );
};
