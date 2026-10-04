import React from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ReferenceDropProps {
    previewUrl: string;
    isUploading: boolean;
    disabled: boolean;
    error: string;
    onPick: (file: File) => void;
    onRemove: () => void;
}

/** Optional reference picture (last year's poster); the input covers the zone so drag and drop works natively. */
export const ReferenceDrop: React.FC<ReferenceDropProps> = ({ previewUrl, isUploading, disabled, error, onPick, onRemove }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) onPick(file);
    };

    if (previewUrl) {
        return (
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <img src={previewUrl} alt="Imagem de referência" className="h-20 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/10" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">Referência pronta</p>
                    <p className="text-xs leading-relaxed text-slate-400">A IA lê o que lá está (edição, local, preços) e atualiza-o com a sua descrição.</p>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={disabled}
                    aria-label="Remover imagem de referência"
                    className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-40"
                >
                    <X size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <div className={cn(
                'group relative flex items-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 p-4 transition-colors focus-within:border-brand-500 hover:border-brand-500/50',
                (disabled || isUploading) && 'opacity-60',
            )}>
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label="Imagem de referência (opcional)"
                    onChange={handleChange}
                    disabled={disabled || isUploading}
                    className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-colors group-hover:text-brand-400">
                    {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                </span>
                <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-200">{isUploading ? 'A preparar a imagem…' : 'Imagem de referência (opcional)'}</span>
                    <span className="block text-xs text-slate-400">Arraste o cartaz do ano passado ou clique para escolher.</span>
                </span>
            </div>
            {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
        </div>
    );
};
