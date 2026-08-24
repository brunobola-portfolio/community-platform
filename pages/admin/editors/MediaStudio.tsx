
import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { Image as ImageIcon, Wand2, Upload, Link as LinkIcon, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { Button, cn } from '../../../components/ui/UIComponents';
import { AdminSelect } from '../components/AdminSelect';
import { STD_INPUT_CLASS, LABEL_CLASS } from '../constants';
import { api } from '../../../convex/_generated/api';
import { DEFAULT_IMAGE_MODEL } from '../../../convex/lib/aiDefaults';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface MediaStudioProps {
    imageUrl: string;
    onChange: (url: string) => void;
    onGenerateAI: (prompt: string, options?: { model?: string; resolution?: string }) => void;
    isGenerating: boolean;
    defaultStyle?: string;
    defaultModel?: string;
    defaultResolution?: string;
}

export const MediaStudio: React.FC<MediaStudioProps> = ({ imageUrl, onChange, onGenerateAI, isGenerating, defaultStyle, defaultModel, defaultResolution }) => {
    const [mode, setMode] = useState<'url' | 'ai' | 'upload'>('ai');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiModel, setAiModel] = useState(defaultModel || DEFAULT_IMAGE_MODEL);
    const [aiResolution, setAiResolution] = useState(defaultResolution || '1k');
    const [uploadError, setUploadError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const getFileUrl = useMutation(api.files.getUrl);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isUploading) return;

        // File size validation
        if (file.size > MAX_FILE_SIZE) {
            setUploadError('Ficheiro demasiado grande. Tamanho máximo: 10 MB.');
            return;
        }
        setUploadError('');
        setIsUploading(true);

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
        } catch (err) {
            console.error('MediaStudio upload error:', err);
            setUploadError('Erro ao carregar a imagem. Tente novamente.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <label className={LABEL_CLASS}>Media Studio</label>
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="relative h-48 w-full bg-black/40 flex items-center justify-center group bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                    {imageUrl ? (
                        <>
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" onClick={() => onChange('')} className="p-3 bg-red-600 rounded-full text-white hover:bg-red-500 shadow-lg transform hover:scale-110 transition-all" aria-label="Remover imagem">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-600">
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            <span className="text-xs">Sem imagem</span>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-2 mb-4 bg-white/5 p-1 rounded-lg w-full sm:w-fit">
                        {([{ id: 'ai', label: 'AI Magic', icon: Wand2 }, { id: 'upload', label: 'Upload', icon: Upload }, { id: 'url', label: 'Link', icon: LinkIcon }] as const).map(m => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => { setMode(m.id); setUploadError(''); }}
                                className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all", mode === m.id ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                            >
                                <m.icon size={14} /> {m.label}
                            </button>
                        ))}
                    </div>
                    {mode === 'ai' && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <div className="min-w-0 flex-1">
                                    <AdminSelect value={aiModel} onChange={e => setAiModel(e.target.value)} aria-label="Modelo de geração de imagem" className="text-xs">
                                        <option value="gemini-3.1-flash-lite-image">NanoBanana 2 Lite</option>
                                        <option value="gemini-3.1-flash-image">NanoBanana 2</option>
                                        <option value="gemini-3-pro-image">NanoBanana Pro</option>
                                        <option value="gemini-2.5-flash-image">NanoBanana (legado)</option>
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
                                        placeholder={defaultStyle ? `Ex: "Futsal..." (${defaultStyle})` : "Descreva..."}
                                        className={cn(STD_INPUT_CLASS, "pl-10")}
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onGenerateAI(aiPrompt, { model: aiModel, resolution: aiResolution }); } }}
                                    />
                                </div>
                                <Button type="button" size="icon" onClick={() => onGenerateAI(aiPrompt, { model: aiModel, resolution: aiResolution })} disabled={isGenerating || !aiPrompt} className="bg-brand-600 hover:bg-brand-500 shrink-0">
                                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                                </Button>
                            </div>
                        </div>
                    )}
                    {mode === 'url' && (
                        <input placeholder="https://..." value={imageUrl} onChange={e => onChange(e.target.value)} className={STD_INPUT_CLASS} />
                    )}
                    {mode === 'upload' && (
                        <div className="space-y-2">
                            <div className="relative border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-brand-500/50 transition-colors cursor-pointer bg-black/20 group">
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait" onChange={handleFileUpload} accept="image/*" disabled={isUploading} />
                                {isUploading
                                    ? <Loader2 size={24} className="mx-auto text-brand-400 mb-2 animate-spin" />
                                    : <Upload size={24} className="mx-auto text-slate-500 mb-2 group-hover:text-brand-400 transition-colors" />}
                                <span className="text-xs text-slate-400">{isUploading ? 'A carregar…' : 'Clique para carregar (máx. 10 MB)'}</span>
                            </div>
                            {uploadError && (
                                <p className="text-red-400 text-xs">{uploadError}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
