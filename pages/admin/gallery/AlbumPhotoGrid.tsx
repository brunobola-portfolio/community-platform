import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Trash2, ImageOff } from 'lucide-react';
import { cn } from '../../../components/ui/UIComponents';
import type { GalleryImage } from '../../../types';

interface AlbumPhotoGridProps {
    images: GalleryImage[];
    coverImageId?: string;
    onCaption: (id: string, caption: string) => void;
    onMove: (id: string, direction: -1 | 1) => void;
    onSetCover: (id: string | null) => void;
    onRemove: (id: string) => void;
    onRemoveMany: (ids: string[]) => void;
}

const ICON_BUTTON = 'p-1.5 rounded-lg bg-black/60 text-white hover:bg-brand-600 disabled:opacity-30 disabled:hover:bg-black/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

/**
 * Photo grid of one album: inline captions, arrow reordering, cover pick,
 * single and bulk delete. Order and cover are persisted by the parent.
 */
export const AlbumPhotoGrid: React.FC<AlbumPhotoGridProps> = ({ images, coverImageId, onCaption, onMove, onSetCover, onRemove, onRemoveMany }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const toggle = (id: string) => setSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const allSelected = images.length > 0 && selected.size === images.length;

    if (images.length === 0) {
        return (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-slate-500">
                <ImageOff className="mx-auto mb-3" size={28} />
                Este álbum ainda não tem fotos. Carrega as primeiras acima.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => setSelected(allSelected ? new Set() : new Set(images.map(i => i.id)))}
                        className="accent-brand-500"
                    />
                    Selecionar todas ({images.length})
                </label>
                {selected.size > 0 && (
                    <button
                        type="button"
                        onClick={() => { onRemoveMany(Array.from(selected)); setSelected(new Set()); }}
                        className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded px-1"
                    >
                        <Trash2 size={13} /> Apagar {selected.size} selecionada{selected.size > 1 ? 's' : ''}
                    </button>
                )}
                <span className="ml-auto">Usa as setas para ordenar · a estrela define a capa</span>
            </div>

            <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {images.map((img, index) => {
                    const isCover = img.id === coverImageId;
                    return (
                        <li key={img.id} className={cn('group rounded-xl overflow-hidden bg-black/30 border', isCover ? 'border-amber-400/70' : 'border-white/10')}>
                            <div className="relative aspect-square">
                                {img.url ? (
                                    <img src={img.url} alt={img.caption || `Foto ${index + 1}`} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageOff size={24} /></div>
                                )}
                                <label className="absolute top-2 left-2 cursor-pointer">
                                    <input type="checkbox" checked={selected.has(img.id)} onChange={() => toggle(img.id)} className="accent-brand-500 w-4 h-4" aria-label={`Selecionar foto ${index + 1}`} />
                                </label>
                                {isCover && (
                                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-amber-400 text-black text-[10px] font-bold px-2 py-0.5">
                                        <Star size={10} fill="currentColor" /> Capa
                                    </span>
                                )}
                                <span className="absolute bottom-2 left-2 text-[10px] font-mono text-white/70 bg-black/50 rounded px-1.5">{index + 1}</span>
                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                    <button type="button" className={ICON_BUTTON} disabled={index === 0} onClick={() => onMove(img.id, -1)} aria-label="Mover para trás"><ChevronLeft size={14} /></button>
                                    <button type="button" className={ICON_BUTTON} disabled={index === images.length - 1} onClick={() => onMove(img.id, 1)} aria-label="Mover para a frente"><ChevronRight size={14} /></button>
                                    <button type="button" className={cn(ICON_BUTTON, isCover && 'bg-amber-500 text-black')} onClick={() => onSetCover(isCover ? null : img.id)} aria-label={isCover ? 'Remover como capa' : 'Definir como capa'}><Star size={14} fill={isCover ? 'currentColor' : 'none'} /></button>
                                    <button type="button" className={cn(ICON_BUTTON, 'hover:bg-red-600')} onClick={() => onRemove(img.id)} aria-label="Apagar foto"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <input
                                defaultValue={img.caption ?? ''}
                                onBlur={e => { if (e.target.value !== (img.caption ?? '')) onCaption(img.id, e.target.value); }}
                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                placeholder="Legenda (opcional)"
                                aria-label={`Legenda da foto ${index + 1}`}
                                className="w-full bg-transparent px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 border-t border-white/5 focus:outline-none focus:bg-white/5"
                            />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
