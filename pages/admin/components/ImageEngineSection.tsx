import React from 'react';
import { useQuery } from 'convex/react';
import { Palette } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { cn } from '../../../components/ui/UIComponents';
import { AdminSelect } from './AdminSelect';
import { Field } from './Field';
import { DEFAULT_OPENROUTER_IMAGE_MODEL, OPENROUTER_IMAGE_MODELS } from '../../../convex/lib/aiDefaults';
import type { AdminAITabProps } from '../types';

interface ImageEngineSectionProps {
    settingsForm: AdminAITabProps['settingsForm'];
    update: <K extends keyof AdminAITabProps['settingsForm']>(key: K, value: AdminAITabProps['settingsForm'][K]) => void;
}

type Engine = 'gemini' | 'openrouter';

const ENGINES: Array<{ id: Engine; name: string; description: string }> = [
    { id: 'gemini', name: 'NanoBanana (Gemini)', description: 'Rápido e económico; usa a chave Gemini do servidor.' },
    { id: 'openrouter', name: 'OpenRouter', description: 'GPT Image 2 e outros; melhor texto nos cartazes, custa mais por imagem.' },
];

/**
 * Engine for the posters of the AI studio and the MediaStudio. Whichever is
 * chosen is tried first; the other one is the automatic fallback.
 */
export const ImageEngineSection: React.FC<ImageEngineSectionProps> = ({ settingsForm, update }) => {
    const caps = useQuery(api.aiStudioInfo.capabilities);
    const engine: Engine = settingsForm.imageProvider ?? 'gemini';
    const available = (id: Engine) => (id === 'gemini' ? caps?.gemini : caps?.openrouter) ?? true;

    return (
        <div className="rounded-2xl border border-white/10 bg-dark-surface p-6">
            <h3 className="mb-2 flex items-center gap-2 font-serif text-xl text-white">
                <Palette className="text-pink-400" /> Motor de imagem
            </h3>
            <p className="mb-6 text-sm text-slate-400">Usado nos cartazes do estúdio de IA e no “Gerar com IA”. Se o motor escolhido falhar, o outro é tentado automaticamente.</p>
            <div role="radiogroup" aria-label="Motor de imagem" className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {ENGINES.map(option => (
                    <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={engine === option.id}
                        onClick={() => update('imageProvider', option.id)}
                        className={cn(
                            'rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                            engine === option.id ? 'border-brand-500/60 bg-brand-500/10' : 'border-white/10 bg-black/20 hover:border-white/25',
                        )}
                    >
                        <span className="block text-sm font-semibold text-white">{option.name}</span>
                        <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
                        {!available(option.id) && (
                            <span className="mt-2 block text-xs text-amber-300">
                                {option.id === 'gemini' ? 'Falta a GEMINI_API_KEY no servidor.' : 'Falta a chave OpenRouter (secção Fornecedor de IA).'}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            {engine === 'openrouter' && (
                <Field label="Modelo OpenRouter" hint="GPT Image 2 escreve o texto dos cartazes com mais rigor; o Mini é mais barato.">
                    <AdminSelect value={settingsForm.openrouterImageModel ?? DEFAULT_OPENROUTER_IMAGE_MODEL} onChange={e => update('openrouterImageModel', e.target.value)}>
                        {OPENROUTER_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </AdminSelect>
                </Field>
            )}
        </div>
    );
};
