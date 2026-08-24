
import React, { useState } from 'react';
import { useAction } from 'convex/react';
import { ConvexError } from 'convex/values';
import { Sparkles, Globe, Server, Loader2, CheckCircle2, XCircle, PlugZap } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { cn } from '../../../components/ui/UIComponents';
import { STD_INPUT_CLASS, LABEL_CLASS } from '../constants';
import type { AdminAITabProps } from '../types';
import { ModelPicker } from './ModelPicker';

type Provider = 'gemini' | 'openrouter' | 'custom';

interface ConfigSectionProps {
    settingsForm: AdminAITabProps['settingsForm'];
    update: <K extends keyof AdminAITabProps['settingsForm']>(key: K, value: AdminAITabProps['settingsForm'][K]) => void;
}

interface TestResult {
    ok: boolean;
    latencyMs: number;
    model: string;
    error?: string;
}

const PROVIDER_CARDS: Array<{ id: Provider; name: string; description: string; icon: React.ElementType }> = [
    { id: 'gemini', name: 'Google Gemini', description: 'Padrão do portal · usa a chave do servidor', icon: Sparkles },
    { id: 'openrouter', name: 'OpenRouter', description: 'Acesso a centenas de modelos com uma só chave', icon: Globe },
    { id: 'custom', name: 'Endpoint próprio / local', description: 'Ollama, LM Studio, vLLM — compatível OpenAI', icon: Server },
];

/**
 * Provider picker + per-provider config (key/url/model) with live model
 * discovery and a connection test. Extracted from AdminAITab to keep files
 * under the project's 300-line limit.
 */
export const ProviderConfigSection: React.FC<ConfigSectionProps> = ({ settingsForm, update }) => {
    const provider = (settingsForm.aiProvider ?? 'gemini') as Provider;
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [testing, setTesting] = useState(false);

    const testProviderAction = useAction(api.aiProviderTools.testProvider);

    const selectProvider = (next: Provider) => {
        if (next === provider) return;
        update('aiProvider', next);
        setTestResult(null);
        setTestError(null);
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        setTestError(null);
        try {
            const args: { provider: string; model?: string; apiUrl?: string; apiKey?: string } = { provider };
            if (provider === 'openrouter') {
                if (settingsForm.openrouterModel) args.model = settingsForm.openrouterModel;
                if (settingsForm.openrouterApiKey) args.apiKey = settingsForm.openrouterApiKey;
            } else if (provider === 'custom') {
                if (settingsForm.customModel) args.model = settingsForm.customModel;
                if (settingsForm.customApiUrl) args.apiUrl = settingsForm.customApiUrl;
                if (settingsForm.customApiKey) args.apiKey = settingsForm.customApiKey;
            }
            const result = await testProviderAction(args);
            setTestResult(result);
        } catch (e) {
            setTestError(e instanceof ConvexError ? String(e.data) : 'Erro ao testar ligação.');
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <Server className="text-blue-400" /> Fornecedor de IA
            </h3>

            <div className="space-y-4">
                <div>
                    <label className={LABEL_CLASS}>Fornecedor do Chat</label>
                    <div role="radiogroup" aria-label="Fornecedor do Chat" className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {PROVIDER_CARDS.map(card => (
                            <ProviderCard
                                key={card.id}
                                {...card}
                                selected={provider === card.id}
                                onSelect={() => selectProvider(card.id)}
                            />
                        ))}
                    </div>
                    <p className="text-slate-600 text-xs mt-2">
                        TTS, geração de imagens e pesquisa/mapas usam sempre Gemini. O chat, a classificação e a melhoria de texto seguem o fornecedor escolhido.
                    </p>
                </div>

                {provider === 'openrouter' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Chave OpenRouter</label>
                            <input
                                type="password"
                                value={settingsForm.openrouterApiKey ?? ''}
                                onChange={e => update('openrouterApiKey', e.target.value)}
                                className={STD_INPUT_CLASS}
                                placeholder="sk-or-v1-..."
                                autoComplete="off"
                            />
                            <ApiKeyHint hasStoredKey={settingsForm.hasOpenrouterApiKey} value={settingsForm.openrouterApiKey} />
                        </div>
                        <ModelPicker
                            provider="openrouter"
                            model={settingsForm.openrouterModel ?? ''}
                            onModelChange={v => update('openrouterModel', v)}
                            apiKey={settingsForm.openrouterApiKey}
                            help="Identificador do modelo em openrouter.ai/models."
                            catalogUrl="https://openrouter.ai/models"
                        />
                    </div>
                )}

                {provider === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>URL Base</label>
                            <input
                                value={settingsForm.customApiUrl ?? ''}
                                onChange={e => update('customApiUrl', e.target.value)}
                                className={STD_INPUT_CLASS}
                                placeholder="http://localhost:11434/v1"
                            />
                            <p className="text-slate-600 text-xs mt-1">Endpoint compatível OpenAI (Ollama, LM Studio, vLLM).</p>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Chave API (opcional)</label>
                            <input
                                type="password"
                                value={settingsForm.customApiKey ?? ''}
                                onChange={e => update('customApiKey', e.target.value)}
                                className={STD_INPUT_CLASS}
                                placeholder="Deixar vazio se não exigir"
                                autoComplete="off"
                            />
                            <ApiKeyHint hasStoredKey={settingsForm.hasCustomApiKey} value={settingsForm.customApiKey} />
                        </div>
                        <ModelPicker
                            provider="custom"
                            model={settingsForm.customModel ?? ''}
                            onModelChange={v => update('customModel', v)}
                            apiUrl={settingsForm.customApiUrl}
                            apiKey={settingsForm.customApiKey}
                            help="Ex: llama3.1"
                        />
                    </div>
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
                <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                    {testing ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />}
                    {testing ? 'A testar…' : 'Testar ligação'}
                </button>

                {testResult && (
                    testResult.ok ? (
                        <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 text-sm">
                            <CheckCircle2 size={16} className="shrink-0" />
                            Ligação estabelecida · {testResult.model} · {testResult.latencyMs}ms
                        </div>
                    ) : (
                        <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            <div className="flex items-center gap-2">
                                <XCircle size={16} className="shrink-0" />
                                {testResult.error ?? 'Falha desconhecida.'}
                            </div>
                            <p className="text-red-400/70 text-xs mt-1.5">
                                Verifica a chave e o modelo. Podes guardar primeiro e testar depois — campos vazios usam os valores já guardados.
                            </p>
                        </div>
                    )
                )}
                {testError && (
                    <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                        <div className="flex items-center gap-2">
                            <XCircle size={16} className="shrink-0" />
                            {testError}
                        </div>
                        <p className="text-red-400/70 text-xs mt-1.5">
                            Verifica a chave e o modelo. Podes guardar primeiro e testar depois — campos vazios usam os valores já guardados.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Provider Card ────────────────────────────────────────────────────────────

interface ProviderCardProps {
    id: Provider;
    name: string;
    description: string;
    icon: React.ElementType;
    selected: boolean;
    onSelect: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ name, description, icon: Icon, selected, onSelect }) => (
    <div
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
            }
        }}
        className={cn(
            'text-left rounded-xl p-4 border cursor-pointer transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            selected
                ? 'border-brand-500 ring-1 ring-brand-500/50 bg-brand-500/10'
                : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
        )}
    >
        <div className="flex items-center gap-2 mb-1.5">
            <Icon size={18} className={selected ? 'text-brand-400' : 'text-slate-400'} />
            <span className={cn('text-sm font-bold', selected ? 'text-white' : 'text-slate-300')}>{name}</span>
        </div>
        <p className="text-slate-500 text-xs leading-snug">{description}</p>
    </div>
);

// ── API Key Hint ─────────────────────────────────────────────────────────────

const ApiKeyHint: React.FC<{ hasStoredKey?: boolean; value?: string }> = ({ hasStoredKey, value }) => {
    if (hasStoredKey && !value) {
        return <p className="text-emerald-400 text-xs mt-1">Chave configurada no servidor — deixa vazio para manter.</p>;
    }
    return <p className="text-slate-600 text-xs mt-1">Guardada em segurança no servidor; nunca é mostrada de volta.</p>;
};

