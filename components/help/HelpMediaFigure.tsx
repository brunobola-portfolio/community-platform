import React from 'react';
import type { HelpMedia } from '../../content/help';

interface HelpMediaFigureProps {
    media: HelpMedia;
}

const FRAME = 'overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-100 shadow-lg dark:border-white/10 dark:bg-black/40';

/**
 * Screenshots and short silent clips. Clips never autoplay and load nothing
 * until asked (preload none), so a guide with three videos costs one poster each.
 */
export const HelpMediaFigure: React.FC<HelpMediaFigureProps> = ({ media }) => {
    if (media.kind === 'image') {
        return (
            <figure className="space-y-2">
                <div className={FRAME}>
                    {/* The visible caption carries the description; repeating it as alt would read it twice */}
                    <img src={media.src} alt="" loading="lazy" decoding="async" className="block h-auto w-full" />
                </div>
                <figcaption className="text-xs text-slate-600 dark:text-slate-400">{media.alt}</figcaption>
            </figure>
        );
    }
    return (
        <figure className="space-y-2">
            <div className={FRAME}>
                <video
                    src={media.src}
                    poster={media.poster}
                    controls
                    muted
                    playsInline
                    preload="none"
                    aria-label={`Vídeo sem som: ${media.description}`}
                    className="block h-auto w-full"
                />
            </div>
            <figcaption className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Vídeo sem som. </span>
                {media.description}
            </figcaption>
        </figure>
    );
};
