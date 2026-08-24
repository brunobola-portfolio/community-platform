
import React, { useMemo, useState } from 'react';
import { useAction } from 'convex/react';
import { ConvexError } from 'convex/values';
import { Search, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { STD_INPUT_CLASS, LABEL_CLASS } from '../constants';

interface ProviderModel {
    id: string;
    name: string;
}

interface ModelPickerProps {
    provider: 'openrouter' | 'custom';
    model: string;
    onModelChange: (value: string) => void;
    apiUrl?: string;
    apiKey?: string;
    help: string;
    catalogUrl?: string;
}

/**
 * Model text input paired with a "browse" panel that calls listModels and
 * lets the admin pick from the live catalog instead of typing an exact id.
 */
export const ModelPicker: React.FC<ModelPickerProps> = ({ provider, model, onModelChange, apiUrl, apiKey, help, catalogUrl }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [models, setModels] = useState<ProviderModel[]>([]);
    const [filter, setFilter] = useState('');

    const listModelsAction = useAction(api.aiProviderTools.listModels);

    const disabled = provider === 'custom' && !apiUrl;

    const browse = async () => {
        if (open) {
            setOpen(false);
            return;
        }
        setOpen(true);
        setLoading(true);
        setError(null);
        try {
            const args: { provider: string; apiUrl?: string; apiKey?: string } = { provider };
            if (apiUrl) args.apiUrl = apiUrl;
            if (apiKey) args.apiKey = apiKey;
            const result = await listModelsAction(args);
            setModels(result);
        } catch (e) {
            setError(e instanceof ConvexError ? String(e.data) : 'Erro ao obter modelos.');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return models;
        return models.filter(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
    }, [models, filter]);

    return (
        <div>
            <label className={LABEL_CLASS}>Modelo</label>
            <input
                value={model}
                onChange={e => onModelChange(e.target.value)}
                className={STD_INPUT_CLASS}
                placeholder={provider === 'openrouter' ? 'openai/gpt-4o-mini' : 'llama3.1'}
            />
            <div className="flex items-center justify-between mt-1.5 gap-2">
                <button
                    type="button"
                    onClick={browse}
                    disabled={disabled}
                    title={disabled ? 'Preenche primeiro o URL Base.' : undefined}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                >
                    <Search size={12} /> Ver modelos disponíveis
                </button>
                {catalogUrl && (
                    <a
                        href={catalogUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    >
                        Catálogo completo em openrouter.ai/models <ExternalLink size={11} />
                    </a>
                )}
            </div>
            <p className="text-slate-600 text-xs mt-1">{help}</p>

            {open && (
                <div className="mt-2 bg-black/40 border border-white/10 rounded-lg p-3">
                    {loading ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                            <Loader2 size={14} className="animate-spin" /> A carregar modelos…
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-md p-2">
                            <XCircle size={14} className="shrink-0" /> {error}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <input
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    placeholder="Filtrar modelos..."
                                    className="flex-1 bg-slate-950/50 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
                                />
                                <span className="text-slate-500 text-xs ml-2 shrink-0">{filtered.length} modelos</span>
                            </div>
                            {filtered.length === 0 ? (
                                <p className="text-slate-500 text-xs py-2 text-center">Nenhum modelo corresponde ao filtro.</p>
                            ) : (
                                <ul className="max-h-64 overflow-y-auto space-y-0.5">
                                    {filtered.map(m => (
                                        <li key={m.id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onModelChange(m.id);
                                                    setOpen(false);
                                                }}
                                                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                            >
                                                <span className="text-white font-mono">{m.id}</span>
                                                {m.name !== m.id && <span className="text-slate-500 ml-2">{m.name}</span>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
