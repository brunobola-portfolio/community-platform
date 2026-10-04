import React, { useState } from 'react';
import { ImageOff, Maximize2, Play, WifiOff } from 'lucide-react';
import type { HelpMedia } from '../../content/help';

interface HelpMediaFigureProps {
    media: HelpMedia;
    /** Opens the shared lightbox on this screenshot. */
    onZoom?: () => void;
}

type VideoMedia = Extract<HelpMedia, { kind: 'video' }>;
type ImageMedia = Extract<HelpMedia, { kind: 'image' }>;

const FRAME = 'relative overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-100 shadow-lg dark:border-white/10 dark:bg-black/40';
const CAPTION = 'text-sm leading-relaxed text-slate-600 dark:text-slate-400';
const FALLBACK = 'flex aspect-video w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-600 dark:text-slate-300';

const HelpVideo: React.FC<{ media: VideoMedia }> = ({ media }) => {
    const [state, setState] = useState<'poster' | 'playing' | 'failed'>('poster');
    return (
        <figure className="space-y-2">
            <div className={FRAME}>
                {state === 'playing' && (
                    <video
                        src={media.src}
                        poster={media.poster}
                        controls
                        autoPlay
                        muted
                        playsInline
                        preload="none"
                        onError={() => setState('failed')}
                        aria-label="Vídeo sem som"
                        className="block h-auto w-full"
                    />
                )}
                {state === 'poster' && (
                    // Nothing downloads until asked: on a phone data plan a guide costs one poster frame
                    <button
                        type="button"
                        onClick={() => setState('playing')}
                        className="group relative block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                    >
                        <img src={media.poster} alt="" loading="lazy" decoding="async" onError={() => setState('failed')} className="block h-auto w-full" />
                        <span aria-hidden="true" className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35" />
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-700 text-white shadow-2xl ring-4 ring-white/80 transition-transform group-hover:scale-105">
                                <Play size={28} fill="currentColor" aria-hidden="true" className="translate-x-0.5" />
                            </span>
                            <span className="rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white">Ver vídeo · sem som</span>
                        </span>
                    </button>
                )}
                {state === 'failed' && (
                    <div className={FALLBACK} role="note">
                        <WifiOff size={24} aria-hidden="true" />
                        <p>Não foi possível carregar o vídeo. O texto em baixo descreve o que ele mostra.</p>
                    </div>
                )}
            </div>
            <figcaption className={CAPTION}>
                <span className="font-semibold text-slate-800 dark:text-slate-200">O que o vídeo mostra: </span>
                {media.description}
            </figcaption>
        </figure>
    );
};

const HelpImage: React.FC<{ media: ImageMedia; onZoom?: () => void }> = ({ media, onZoom }) => {
    const [failed, setFailed] = useState(false);
    return (
        <figure className="space-y-2">
            <div className={FRAME}>
                {failed ? (
                    <div className={FALLBACK} role="note">
                        <ImageOff size={24} aria-hidden="true" />
                        <p>A imagem não carregou. A legenda em baixo descreve o que ela mostra.</p>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onZoom}
                        aria-label={`Ampliar imagem: ${media.alt}`}
                        className="group relative block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                    >
                        {/* The visible caption carries the description; repeating it as alt would read it twice */}
                        <img src={media.src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} className="block h-auto w-full" />
                        <span aria-hidden="true" className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
                            <Maximize2 size={14} /> Ampliar
                        </span>
                    </button>
                )}
            </div>
            <figcaption className={CAPTION}>{media.alt}</figcaption>
        </figure>
    );
};

/** Screenshots (tap to zoom) and short silent clips, each with its text always on screen. */
export const HelpMediaFigure: React.FC<HelpMediaFigureProps> = ({ media, onZoom }) =>
    media.kind === 'image' ? <HelpImage media={media} onZoom={onZoom} /> : <HelpVideo media={media} />;
