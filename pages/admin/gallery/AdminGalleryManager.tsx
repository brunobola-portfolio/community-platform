import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Images, Edit2, Trash2, Calendar, Plus } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button, cn } from '../../../components/ui/UIComponents';
import { PhotoUploader } from './PhotoUploader';
import { AlbumPhotoGrid } from './AlbumPhotoGrid';
import type { EntityHandlers } from '../AdminEntityTabs';
import type { Album, GalleryImage } from '../../../types';

interface AdminGalleryManagerProps extends EntityHandlers {
    albums: Album[];
    onNewAlbum: () => void;
    notify: (message: string, type: 'success' | 'error') => void;
}

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Master-detail gallery manager: albums on the left, the selected album's
 * photos on the right with upload, captions, ordering and cover selection.
 * Album metadata (title, date, description, external cover) still goes
 * through the shared form modal.
 */
export const AdminGalleryManager: React.FC<AdminGalleryManagerProps> = ({ albums, openEditModal, handleDeleteRequest, onNewAlbum, notify }) => {
    const [selectedId, setSelectedId] = useState<string | null>(albums[0]?.id ?? null);
    useEffect(() => {
        if (!selectedId || !albums.some(a => a.id === selectedId)) setSelectedId(albums[0]?.id ?? null);
    }, [albums, selectedId]);

    const detail = useQuery(api.albums.getWithImages, selectedId ? { id: selectedId as Id<'albums'> } : 'skip');
    const updateImage = useMutation(api.albums.updateImage);
    const removeImage = useMutation(api.albums.removeImage);
    const reorderImages = useMutation(api.albums.reorderImages);
    const setCoverImage = useMutation(api.albums.setCoverImage);

    const images = useMemo<GalleryImage[]>(
        () => (detail?.images ?? []).map(i => ({ id: i._id, url: i.url, caption: i.caption, order: i.order, uploadedAt: i.uploadedAt, isStored: Boolean(i.storageId) })),
        [detail]
    );
    const selected = albums.find(a => a.id === selectedId);
    const albumId = selectedId as Id<'albums'> | null;

    const run = async (work: () => Promise<unknown>, okMessage?: string) => {
        try {
            await work();
            if (okMessage) notify(okMessage, 'success');
        } catch (e) {
            notify(e instanceof Error ? e.message : 'A operação falhou.', 'error');
        }
    };

    const move = (id: string, direction: -1 | 1) => {
        if (!albumId) return;
        const ids = images.map(i => i.id);
        const from = ids.indexOf(id);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= ids.length) return;
        [ids[from], ids[to]] = [ids[to], ids[from]];
        void run(() => reorderImages({ albumId, ids: ids as Id<'galleryImages'>[] }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 animate-fade-in-up">
            <aside className="bg-dark-surface border border-white/10 rounded-2xl overflow-hidden self-start">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{albums.length} álbum{albums.length === 1 ? '' : 's'}</span>
                    <Button size="sm" variant="glass" onClick={onNewAlbum}><Plus size={14} className="mr-1" /> Novo</Button>
                </div>
                {albums.length === 0 ? (
                    <p className="p-6 text-sm text-slate-500">Cria o primeiro álbum para começar a carregar fotos.</p>
                ) : (
                    <ul className="max-h-[70vh] overflow-y-auto divide-y divide-white/5" role="listbox" aria-label="Álbuns">
                        {albums.map(a => (
                            <li key={a.id}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={a.id === selectedId}
                                    onClick={() => setSelectedId(a.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500',
                                        a.id === selectedId ? 'bg-brand-500/10' : 'hover:bg-white/5'
                                    )}
                                >
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/40 shrink-0">
                                        {a.coverUrl ? <img src={a.coverUrl} alt="" className="w-full h-full object-cover" /> : <Images className="w-full h-full p-4 text-slate-600" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className={cn('font-semibold truncate', a.id === selectedId ? 'text-white' : 'text-slate-200')}>{a.title}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                            <Calendar size={11} /> {formatDate(a.date)} · {a.photoCount ?? a.photos.length} fotos
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>

            <section className="bg-dark-surface border border-white/10 rounded-2xl p-5 md:p-6 space-y-6 min-w-0">
                {!selected || !albumId ? (
                    <p className="text-slate-500 text-sm">Seleciona um álbum à esquerda.</p>
                ) : (
                    <>
                        <header className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="w-28 h-28 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
                                {(detail?.coverUrl ?? selected.coverUrl) ? (
                                    <img src={detail?.coverUrl ?? selected.coverUrl ?? ''} alt={`Capa de ${selected.title}`} className="w-full h-full object-cover" />
                                ) : (
                                    <Images className="w-full h-full p-8 text-slate-600" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-2xl font-serif text-white truncate">{selected.title}</h3>
                                <p className="text-xs text-slate-500 mt-1">{formatDate(selected.date)} · {images.length} fotos{detail?.coverImageId ? ' · capa escolhida entre as fotos' : ''}</p>
                                {selected.description && <p className="text-sm text-slate-400 mt-2 line-clamp-2">{selected.description}</p>}
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button size="sm" variant="glass" onClick={() => openEditModal('album', selected)}><Edit2 size={14} className="mr-2" /> Editar</Button>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteRequest('album', selected.id, selected.title)}><Trash2 size={14} className="mr-2" /> Apagar</Button>
                            </div>
                        </header>

                        <PhotoUploader
                            albumId={albumId}
                            onDone={(added, failed) => {
                                if (added) notify(`${added} foto${added > 1 ? 's' : ''} adicionada${added > 1 ? 's' : ''}.`, 'success');
                                if (failed) notify(`${failed} foto${failed > 1 ? 's' : ''} falhou.`, 'error');
                            }}
                        />

                        <AlbumPhotoGrid
                            images={images}
                            coverImageId={detail?.coverImageId ?? undefined}
                            onCaption={(id, caption) => void run(() => updateImage({ id: id as Id<'galleryImages'>, caption }))}
                            onMove={move}
                            onSetCover={id => void run(() => setCoverImage({ albumId, imageId: id ? (id as Id<'galleryImages'>) : null }), id ? 'Capa atualizada.' : 'Capa removida.')}
                            onRemove={id => { if (window.confirm('Apagar esta foto? Esta ação não pode ser anulada.')) void run(() => removeImage({ id: id as Id<'galleryImages'> }), 'Foto apagada.'); }}
                            onRemoveMany={ids => {
                                if (!window.confirm(`Apagar ${ids.length} fotos? Esta ação não pode ser anulada.`)) return;
                                void run(async () => { for (const id of ids) await removeImage({ id: id as Id<'galleryImages'> }); }, `${ids.length} fotos apagadas.`);
                            }}
                        />
                    </>
                )}
            </section>
        </div>
    );
};
