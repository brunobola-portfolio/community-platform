
import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { Image as ImageIcon, Wand2, Upload, Link as LinkIcon, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { Button, cn } from '../../../components/ui/UIComponents';
import { AdminSelect } from '../components/AdminSelect';
import { STD_INPUT_CLASS, LABEL_CLASS } from '../constants';
import { api } from '../../../convex/_generated/api';
import { DEFAULT_IMAGE_MODEL } from '../../../convex/lib/aiDefaults';
import { GEMINI_IMAGE_MODELS } from '../../../convex/lib/aiDefaults';
import { optimizeImage } from '../../../utils/imageOptimize';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface MediaStudioProps {
    imageUrl: string;
    onChange: (url: string) => void;
    /** Without it the studio offers upload and link only (e.g. site photos in the settings). */
    onGenerateAI?: (prompt: string, options?: { model?: string; resolution?: string }) => void;
    isGenerating?: boolean;
    defaultStyle?: string;
    defaultModel?: string;
    defaultResolution?: string;
    /** Section title; events call it a poster, articles a cover. */
    label?: string;
}

const MODES = [
    { id: 'upload', label: 'Carregar', icon: Upload },
    { id: 'url', label: 'Colar link', icon: LinkIcon },
    { id: 'ai', label: 'Gerar com IA', icon: Wand2 },
] as const;

const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const MediaStudio: React.FC<MediaStudioProps> = ({ imageUrl, onChange, onGenerateAI, isGenerating = false, defaultStyle, defaultModel, defaultResolution, label = 'Imagem' }) => {
    // Uploading a poster or a photo is the everyday action; generation is the exception
    const [mode, setMode] = useState<'url' | 'ai' | 'upload'>('upload');
    const [savedNote, setSavedNote] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiModel, setAiModel] = useState(defaultModel || DEFAULT_IMAGE_MODEL);
    const [aiResolution, setAiResolution] = useState(defaultResolution || '1k');
    const [uploadError, setUploadError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const getFileUrl = useMutation(api.files.getUrl);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        // Clearing lets the same file be picked again after an error
        e.target.value = '';
        if (!picked || isUploading) return;
        setUploadError('');
        setSavedNote('');
        setIsUploading(true);

        // Optimised first: a phone photo of a poster shrinks from megabytes to a
        // few hundred KB, so the 10 MB ceiling only applies to what is uploaded
        const file = await optimizeImage(picked);
        if (file.size > MAX_FILE_SIZE) {
            setUploadError('Ficheiro demasiado grande. Tamanho máximo: 10 MB.');
            setIsUploading(false);
            return;
        }

        // Upload to Convex storage: base64 data URIs would blow past the 1MB
        // document limit and bloat every query that returns the entity
        try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type || 'application/octet-stream' },
                body: file,
            });
            if (!result.ok) throw new Error(`Upload falhou (HTTP ${result.status})`);
            const { storageId } = await result.json();
            const url = await getFileUrl({ storageId });
            if (!url) throw new Error('Não foi possível obter o URL do ficheiro.');
            onChange(url);
            if (file !== picked) setSavedNote(`Otimizada: ${formatSize(picked.size)} → ${formatSize(file.size)}`);
        } catch (err) {
            console.error('MediaStudio upload error:', err);
            setUploadError('Erro ao carregar a imagem. Tente novamente.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <span className={LABEL_CLASS}>{label}</span>
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="relative h-56 w-full overflow-hidden bg-black/40 flex items-center justify-center group">
                    {imageUrl ? (
                        <>
                            {/* Whole image over a blurred copy: a portrait poster is not cropped here either */}
                            <img src={imageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl" />
                            <img src={imageUrl} alt="Pré-visualização" className="relative w-full h-full object-contain" />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-600">
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            <span className="text-xs">Sem imagem</span>
                        </div>
                    )}
                </div>
                {imageUrl && (
                    <div className="flex justify-end border-t border-white/5 px-4 pt-3">
                        <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                            <Trash2 size={14} aria-hidden="true" /> Remover imagem
                        </button>
                    </div>
                )}
                <div className="p-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-2 mb-4 bg-white/5 p-1 rounded-lg w-full sm:w-fit">
                        {MODES.filter(m => m.id !== 'ai' || onGenerateAI).map(m => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => { setMode(m.id); setUploadError(''); setSavedNote(''); }}
                                aria-pressed={mode === m.id}
                                className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all", mode === m.id ? "bg-brand-700 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                            >
                                <m.icon size={14} /> {m.label}
                            </button>
                        ))}
                    </div>
                    {mode === 'ai' && onGenerateAI && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="min-w-0 flex-1">
                                    <AdminSelect value={aiModel} onChange={e => setAiModel(e.target.value)} aria-label="Modelo de geração de imagem" className="text-xs">
                                        {GEMINI_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                    </AdminSelect>
                                </div>
                                <div className="w-24 shrink-0">
                                    <AdminSelect value={aiResolution} onChange={e => setAiResolution(e.target.value)} aria-label="Resolução" className="text-xs">
                                        <option value="1k">1K</option>
                                        <option value="2k">2K</option>
                                        <option value="4k">4K</option>
                                    </AdminSelect>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 min-w-0 relative">
                                    <Sparkles size={16} className="absolute left-3 top-3 text-brand-400" />
                                    <input
                                        aria-label="Descrição da imagem a gerar"
                                        placeholder={defaultStyle ? `Ex: "Futsal..." (${defaultStyle})` : "Descreva..."}
                                        className={cn(STD_INPUT_CLASS, "pl-10")}
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onGenerateAI(aiPrompt, { model: aiModel, resolution: aiResolution }); } }}
                                    />
                                </div>
                                <Button type="button" size="icon" aria-label="Gerar imagem" onClick={() => onGenerateAI(aiPrompt, { model: aiModel, resolution: aiResolution })} disabled={isGenerating || !aiPrompt} className="bg-brand-700 hover:bg-brand-800 shrink-0">
                                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                                </Button>
                            </div>
                        </div>
                    )}
                    {mode === 'url' && (
                        <input aria-label="Endereço da imagem" placeholder="https://..." value={imageUrl} onChange={e => onChange(e.target.value)} className={STD_INPUT_CLASS} />
                    )}
                    {mode === 'upload' && (
                        <div className="space-y-2">
                            {/* The input covers the zone, so dropping a file on it works natively */}
                            <div className="relative border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-brand-500/50 focus-within:border-brand-500 transition-colors cursor-pointer bg-black/20 group">
                                <input type="file" aria-label={`Escolher ficheiro: ${label}`} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait" onChange={handleFileUpload} accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" disabled={isUploading} />
                                {isUploading
                                    ? <Loader2 size={24} className="mx-auto text-brand-400 mb-2 animate-spin" />
                                    : <Upload size={24} className="mx-auto text-slate-400 mb-2 group-hover:text-brand-400 transition-colors" />}
                                <span role="status" className="block text-sm text-slate-300">{isUploading ? 'A otimizar e a carregar…' : 'Arraste o ficheiro para aqui ou clique para escolher'}</span>
                                {!isUploading && <span className="mt-1 block text-xs text-slate-400">JPG, PNG ou WebP · as fotografias grandes são otimizadas automaticamente</span>}
                            </div>
                            {savedNote && <p className="text-emerald-400 text-xs" role="status">{savedNote}</p>}
                            {uploadError && (
                                <p className="text-red-400 text-xs" role="alert">{uploadError}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
