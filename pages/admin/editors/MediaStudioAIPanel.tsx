import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Button, cn } from '../../../components/ui/UIComponents';
import { AdminSelect } from '../components/AdminSelect';
import { STD_INPUT_CLASS } from '../constants';
import { api } from '../../../convex/_generated/api';
import { DEFAULT_IMAGE_MODEL, GEMINI_IMAGE_MODELS, OPENROUTER_IMAGE_MODELS } from '../../../convex/lib/aiDefaults';
import { isOwnStorageUrl } from '../../../convex/lib/referenceUrl';
import type { GenerateImageOptions } from '../types';

type Engine = 'gemini' | 'openrouter';

interface MediaStudioAIPanelProps {
    imageUrl: string;
    onGenerate: (prompt: string, options?: GenerateImageOptions) => void;
    isGenerating: boolean;
    defaultStyle?: string;
    defaultModel?: string;
    defaultResolution?: string;
}

/** The server only reads references from this deployment's own storage (SSRF guard), so pasted links are not offered. */
const canReference = (url: string) => isOwnStorageUrl(url, import.meta.env.VITE_CONVEX_URL as string | undefined);

/** "Gerar com IA" mode of the MediaStudio: prompt, engine, Gemini model, resolution and the current image as reference. */
export const MediaStudioAIPanel: React.FC<MediaStudioAIPanelProps> = ({ imageUrl, onGenerate, isGenerating, defaultStyle, defaultModel, defaultResolution }) => {
    const caps = useQuery(api.aiStudioInfo.capabilities);
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState(defaultModel || DEFAULT_IMAGE_MODEL);
    const [resolution, setResolution] = useState(defaultResolution || '1k');
    const [engine, setEngine] = useState<Engine | ''>('');
    const [useReference, setUseReference] = useState(false);

    const chosenEngine: Engine = engine || caps?.defaultEngine || 'gemini';
    const referenceAvailable = Boolean(imageUrl) && canReference(imageUrl);
    const submit = () => {
        if (!prompt || isGenerating) return;
        onGenerate(prompt, {
            model: chosenEngine === 'gemini' ? model : undefined,
            resolution,
            engine: caps?.openrouter ? chosenEngine : undefined,
            referenceUrl: referenceAvailable && useReference ? imageUrl : undefined,
        });
    };

    return (
        <div className="space-y-3">
            {caps?.openrouter && (
                <AdminSelect value={chosenEngine} onChange={e => setEngine(e.target.value as Engine)} aria-label="Motor de imagem" className="text-xs">
                    {caps.gemini && <option value="gemini">NanoBanana (Gemini)</option>}
                    <option value="openrouter">{OPENROUTER_IMAGE_MODELS.find(m => m.id === caps.openrouterImageModel)?.label ?? caps.openrouterImageModel}</option>
                </AdminSelect>
            )}
            <div className="flex gap-2">
                {chosenEngine === 'gemini' && (
                    <div className="min-w-0 flex-1">
                        <AdminSelect value={model} onChange={e => setModel(e.target.value)} aria-label="Modelo de geração de imagem" className="text-xs">
                            {GEMINI_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </AdminSelect>
                    </div>
                )}
                <div className={cn('shrink-0', chosenEngine === 'gemini' ? 'w-24' : 'w-full')}>
                    <AdminSelect value={resolution} onChange={e => setResolution(e.target.value)} aria-label="Resolução" className="text-xs">
                        <option value="1k">1K</option>
                        <option value="2k">2K</option>
                        <option value="4k">4K</option>
                    </AdminSelect>
                </div>
            </div>
            {referenceAvailable && (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                    <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={useReference} onChange={e => setUseReference(e.target.checked)} />
                    Usar a imagem atual como referência
                </label>
            )}
            <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                    <Sparkles size={16} className="absolute left-3 top-3 text-brand-400" />
                    <input
                        aria-label="Descrição da imagem a gerar"
                        placeholder={useReference && referenceAvailable ? 'O que mudar? Ex: "atualizar a data para 18 de outubro"' : defaultStyle ? `Ex: "Futsal..." (${defaultStyle})` : 'Descreva...'}
                        className={cn(STD_INPUT_CLASS, 'pl-10')}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
                    />
                </div>
                <Button type="button" size="icon" aria-label="Gerar imagem" onClick={submit} disabled={isGenerating || !prompt} className="shrink-0 bg-brand-700 hover:bg-brand-800">
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                </Button>
            </div>
        </div>
    );
};
