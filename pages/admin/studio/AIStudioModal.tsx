import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Button, Modal } from '../../../components/ui/UIComponents';
import { cn } from '../../../utils/cn';
import { AdminSelect } from '../components/AdminSelect';
import { Field } from '../components/Field';
import { STD_INPUT_CLASS } from '../constants';
import { ReferenceDrop } from './ReferenceDrop';
import { StudioProgress } from './StudioProgress';
import { useStudioUploads } from './useStudioUploads';
import { AIBudgetWarning } from '../ai/AIBudgetWarning';
import { draftCostSentence, studioEstimateLine } from '../ai/aiUsageCopy';
import { draftToFormData } from './draftToForm';
import { EXAMPLES, PLACEHOLDER, localStamp, stageAt, stagesFor, studioErrorMessage, type StageId, type StudioKind, posterWaitHint } from './studioCopy';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { OPENROUTER_IMAGE_MODELS } from '../../../convex/lib/aiDefaults';
import { optimizeImage } from '../../../utils/imageOptimize';
import type { AdminFormData } from '../types';

const MAX_BRIEF = 2000;
const FORM_ID = 'ai-studio-form';

type Engine = 'gemini' | 'openrouter';

interface AIStudioModalProps {
    kind: StudioKind;
    onClose: () => void;
    /** Receives the prefilled form; nothing is saved until the secretary presses Guardar. */
    onDraft: (type: StudioKind, data: AdminFormData, notes: string[]) => void;
}

interface Reference { url: string; storageId: Id<'_storage'> }

const openRouterLabel = (id: string) => OPENROUTER_IMAGE_MODELS.find(m => m.id === id)?.label ?? id;

export const AIStudioModal: React.FC<AIStudioModalProps> = ({ kind, onClose, onDraft }) => {
    const draftAction = useAction(api.aiStudio.draft);
    const caps = useQuery(api.aiStudioInfo.capabilities);
    const { upload, release, optimizeGenerated } = useStudioUploads();

    const [brief, setBrief] = useState('');
    const [reference, setReference] = useState<Reference | null>(null);
    const [refUploading, setRefUploading] = useState(false);
    const [refError, setRefError] = useState('');
    const [withImage, setWithImage] = useState(true);
    const [posterText, setPosterText] = useState(kind === 'event');
    const [engine, setEngine] = useState<Engine | ''>('');
    const [running, setRunning] = useState(false);
    const [stage, setStage] = useState<StageId>('text');
    const [error, setError] = useState('');
    // Bumped on cancel/close: a reply that arrives for an older run is discarded, and its files released
    const runRef = useRef(0);
    const startedAt = useRef(0);
    const referenceRef = useRef<Reference | null>(null);
    referenceRef.current = reference;

    const hasImageEngine = Boolean(caps && (caps.gemini || caps.openrouter));
    const imageOn = withImage && hasImageEngine;
    const hasReference = Boolean(reference);
    const stages = useMemo(() => stagesFor(hasReference, imageOn), [hasReference, imageOn]);
    const chosenEngine: Engine | undefined = engine || caps?.defaultEngine || undefined;

    useEffect(() => {
        if (!running) return;
        const timer = window.setInterval(() => {
            setStage(current => (current === 'polish' ? current : stageAt(Date.now() - startedAt.current, stages)));
        }, 400);
        return () => window.clearInterval(timer);
    }, [running, stages]);

    const pickReference = async (picked: File) => {
        setRefError('');
        setRefUploading(true);
        try {
            const file = await optimizeImage(picked);
            if (file.size > 10 * 1024 * 1024) { setRefError('A imagem é demasiado grande (máximo 10 MB).'); return; }
            const stored = await upload(file);
            release(referenceRef.current?.url);
            setReference(stored);
        } catch (e) {
            console.error('AI studio reference upload:', e);
            setRefError('Não foi possível carregar a imagem. Tente outra.');
        } finally {
            setRefUploading(false);
        }
    };

    const removeReference = () => { release(reference?.url); setReference(null); };

    const cancelRun = () => { runRef.current += 1; setRunning(false); };

    const close = () => {
        runRef.current += 1;
        release(referenceRef.current?.url);
        onClose();
    };

    const finish = async (runId: number, result: Awaited<ReturnType<typeof draftAction>>) => {
        let imageUrl = result.imageUrl;
        if (imageUrl) {
            setStage('polish');
            imageUrl = await optimizeGenerated(imageUrl);
        }
        if (runRef.current !== runId) { release(imageUrl); return; }
        const mapped = draftToFormData(result, { nowLocal: localStamp().minute, imageUrl });
        if (!mapped) throw new Error('ERR_GENERIC');
        release(referenceRef.current?.url);
        const cost = draftCostSentence(result.costUsd);
        onDraft(mapped.type, mapped.data, cost ? [...result.notes, cost] : result.notes);
    };

    const run = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (running || refUploading || brief.trim().length < 3) return;
        const runId = ++runRef.current;
        setError('');
        setStage(stages[0]);
        startedAt.current = Date.now();
        setRunning(true);
        try {
            const result = await draftAction({
                kind,
                brief: brief.trim().slice(0, MAX_BRIEF),
                referenceStorageId: reference?.storageId,
                withImage: imageOn,
                posterText: imageOn && posterText,
                imageEngine: imageOn ? chosenEngine : undefined,
                today: localStamp().day,
            });
            if (runRef.current !== runId) { release(result.imageUrl); return; }
            await finish(runId, result);
        } catch (err) {
            if (runRef.current !== runId) return;
            console.error('AI studio draft failed:', err);
            setError(studioErrorMessage(err));
            setRunning(false);
        }
    };

    const noun = kind === 'event' ? 'evento' : 'notícia';
    const footer = (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-slate-400">{running ? 'Pode fechar: nada é guardado sem a sua revisão.' : 'Ctrl + Enter também cria o rascunho.'}</span>
            <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={running ? cancelRun : close}>Cancelar</Button>
                <Button type="submit" form={FORM_ID} disabled={running || refUploading || brief.trim().length < 3} className="min-w-[170px]">
                    {running ? <><Loader2 size={16} className="animate-spin" /> A criar…</> : <><Wand2 size={16} /> Criar rascunho</>}
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen
            onClose={close}
            size="lg"
            icon={<Sparkles size={20} />}
            eyebrow="Estúdio de IA"
            title={kind === 'event' ? 'Criar evento com IA' : 'Criar notícia com IA'}
            description={`Escreva o essencial. A IA preenche o formulário${kind === 'event' ? ' e cria o cartaz' : ''}; nada fica publicado até rever e guardar.`}
            footer={footer}
        >
            {running ? (
                <StudioProgress stages={stages} current={stage} hint={posterWaitHint(imageOn ? chosenEngine : undefined, caps?.openrouterImageModel)} />
            ) : (
                <form id={FORM_ID} onSubmit={run} className="space-y-5">
                    <Field label={`O que quer anunciar? (${noun})`} hint={`${brief.length}/${MAX_BRIEF} caracteres`}>
                        <textarea
                            value={brief}
                            onChange={e => setBrief(e.target.value.slice(0, MAX_BRIEF))}
                            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void run(); }}
                            rows={5}
                            placeholder={PLACEHOLDER[kind]}
                            className={cn(STD_INPUT_CLASS, 'resize-y text-base leading-relaxed')}
                        />
                    </Field>
                    <div className="flex flex-wrap gap-2" aria-label="Exemplos">
                        {EXAMPLES[kind].map(example => (
                            <button
                                key={example}
                                type="button"
                                onClick={() => setBrief(example)}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-slate-300 transition-colors hover:border-brand-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                                {example.length > 60 ? `${example.slice(0, 58)}…` : example}
                            </button>
                        ))}
                    </div>
                    <ReferenceDrop previewUrl={reference?.url ?? ''} isUploading={refUploading} disabled={running} error={refError} onPick={file => void pickReference(file)} onRemove={removeReference} />
                    <ImageOptions
                        kind={kind}
                        hasImageEngine={hasImageEngine}
                        withImage={withImage}
                        posterText={posterText}
                        onWithImage={setWithImage}
                        onPosterText={setPosterText}
                        engineSelect={caps?.openrouter ? (
                            <AdminSelect value={chosenEngine ?? ''} onChange={e => setEngine(e.target.value as Engine)} disabled={!imageOn} className="text-sm">
                                {caps.gemini && <option value="gemini">NanoBanana (Gemini) — recomendado, ~10 s, ~0,07 $</option>}
                                <option value="openrouter">{openRouterLabel(caps.openrouterImageModel)}</option>
                            </AdminSelect>
                        ) : null}
                    />
                    <p className="text-xs text-slate-400">
                        Custo estimado: <span className="text-slate-200">{studioEstimateLine(imageOn, { engine: chosenEngine, openrouterModel: caps?.openrouterImageModel, geminiModel: caps?.geminiImageModel })}</span>
                    </p>
                    <AIBudgetWarning />
                    {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
                </form>
            )}
        </Modal>
    );
};

interface ImageOptionsProps {
    kind: StudioKind;
    hasImageEngine: boolean;
    withImage: boolean;
    posterText: boolean;
    onWithImage: (value: boolean) => void;
    onPosterText: (value: boolean) => void;
    engineSelect: React.ReactElement | null;
}

const CHECK_ROW = 'flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3 focus-within:ring-2 focus-within:ring-brand-500';

const ImageOptions: React.FC<ImageOptionsProps> = ({ kind, hasImageEngine, withImage, posterText, onWithImage, onPosterText, engineSelect }) => {
    if (!hasImageEngine) {
        return <p className="text-xs text-slate-400">Não há motor de imagem configurado: o rascunho segue sem {kind === 'event' ? 'cartaz' : 'imagem'}.</p>;
    }
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={CHECK_ROW}>
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-500" checked={withImage} onChange={e => onWithImage(e.target.checked)} />
                    <span>
                        <span className="block text-sm font-semibold text-white">{kind === 'event' ? 'Gerar cartaz' : 'Gerar imagem de capa'}</span>
                        <span className="block text-xs text-slate-400">Fica no formulário; pode trocá-la antes de guardar.</span>
                    </span>
                </label>
                {kind === 'event' && (
                    <label className={cn(CHECK_ROW, !withImage && 'opacity-50')}>
                        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-500" checked={posterText} disabled={!withImage} onChange={e => onPosterText(e.target.checked)} />
                        <span>
                            <span className="block text-sm font-semibold text-white">Cartaz com texto</span>
                            <span className="block text-xs text-slate-400">Título, data e local escritos no cartaz. Desligado: só a ilustração.</span>
                        </span>
                    </label>
                )}
            </div>
            {engineSelect && <Field label="Motor de imagem">{engineSelect}</Field>}
        </div>
    );
};
