
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { useData } from '../context/DataContext';
import { ArrowLeft, Image, Calendar } from 'lucide-react';
import { Button } from '../components/ui/UIComponents';
import { Skeleton } from '../components/ui/Skeleton';
import { Lightbox } from '../components/ui/Lightbox';

export const GalleryPage: React.FC<{ onNavigate: (page: string) => void }> = () => {
    const { albums, isLoading, settings } = useData();
    const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Only fetch full photos when an album is selected (avoids N+1 on grid view)
    const albumDetail = useQuery(
        api.albums.getWithImages,
        selectedAlbum ? { id: selectedAlbum as Id<"albums"> } : "skip"
    );

    const activeAlbum = albumDetail ? { ...albumDetail, id: albumDetail._id as string } : undefined;

    const lightboxImages = (activeAlbum?.photos ?? []).map((photo, i) => ({
        src: photo,
        alt: `Foto ${i + 1} de ${activeAlbum?.title ?? 'álbum'}`,
    }));

    return (
        <div className="pt-32 pb-24 min-h-screen bg-slate-50 dark:bg-dark-bg">
            <title>{`Galeria — ${settings.siteName}`}</title>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <span className="text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] text-xs font-bold border border-brand-500/30 px-4 py-1 rounded-full">Multimédia</span>
                    <h1 className="text-5xl md:text-7xl font-serif text-slate-900 dark:text-white mt-6 mb-6">Galeria <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 dark:from-brand-400 to-purple-500 dark:to-purple-300">Visual</span></h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
                        Recorde os melhores momentos da vida comunitária.
                    </p>
                </div>

                {isLoading ? (
                    // Loading Skeletons
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-3xl overflow-hidden border border-slate-900/10 dark:border-white/10">
                                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                            </div>
                        ))}
                    </div>
                ) : selectedAlbum === null ? (
                    // Albums Grid
                    albums.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-900/10 dark:border-white/10 rounded-3xl animate-fade-in-up">
                            <div className="w-20 h-20 bg-slate-900/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-500 dark:text-slate-600">
                                <Image size={32} />
                            </div>
                            <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-2">Sem álbuns disponíveis</h3>
                            <p className="text-slate-500 text-center max-w-md">A galeria será atualizada em breve com os melhores momentos da comunidade.</p>
                        </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
                        {albums.map(album => (
                            <div
                                key={album.id}
                                className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer border border-slate-900/10 dark:border-white/10 shadow-xl"
                                role="button"
                                tabIndex={0}
                                aria-label={`Álbum: ${album.title}, ${album.photoCount ?? album.photos?.length ?? 0} fotos`}
                                onClick={() => setSelectedAlbum(album.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAlbum(album.id); } }}
                            >
                                <img src={album.coverUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop'} alt={album.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop'; }} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"></div>
                                <div className="absolute bottom-0 left-0 p-8 w-full">
                                    <h3 className="text-2xl font-serif text-white mb-2 group-hover:text-brand-400 transition-colors">{album.title}</h3>
                                    <div className="flex items-center justify-between text-sm text-slate-300">
                                        <span className="flex items-center gap-2"><Image size={16} /> {album.photoCount ?? album.photos?.length ?? 0} Fotos</span>
                                        <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(album.date).getFullYear()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    )
                ) : (
                    // Single Album View
                    <div className="animate-fade-in-up">
                        <Button onClick={() => setSelectedAlbum(null)} variant="ghost" className="mb-8 pl-0 hover:bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            <ArrowLeft className="mr-2" size={20} /> Voltar aos Álbuns
                        </Button>

                        <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-8 border-b border-slate-900/10 dark:border-white/10 pb-4">{activeAlbum?.title}</h2>

                        <div className="columns-1 md:columns-3 gap-6 space-y-6">
                            {activeAlbum?.photos.map((photo, i) => (
                                <div
                                    key={photo}
                                    className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Ampliar foto ${i + 1} de ${activeAlbum?.title}`}
                                    onClick={() => setLightboxIndex(i)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxIndex(i); } }}
                                >
                                    <img src={photo} alt={`Foto ${i + 1} de ${activeAlbum?.title}`} loading="lazy" className="w-full rounded-2xl border border-slate-900/10 dark:border-white/10 transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Lightbox
                images={lightboxImages}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onNavigate={setLightboxIndex}
            />
        </div>
    );
};

/**
 * Router wrapper for GalleryPage.
 * Bridges React Router navigation to the legacy prop-based interface.
 */
export const GalleryPageWrapper: React.FC = () => {
  const navigate = useNavigate();

  return (
    <GalleryPage
      onNavigate={(page: string) => {
        const pathMap: Record<string, string> = {
          home: '/', about: '/about', history: '/history', team: '/team',
          events: '/events', blog: '/blog', gallery: '/gallery',
        };
        navigate(pathMap[page] || '/');
      }}
    />
  );
};
