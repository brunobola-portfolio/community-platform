import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Lightbox } from '../ui/Lightbox';

interface EventPosterProps {
    src?: string;
    /** Event title: names the poster for screen readers and the full-screen view. */
    title: string;
}

const FALLBACK = 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop';

/**
 * Event images are usually posters: portrait, with the date and the details
 * printed at the top and the bottom. A cover crop cuts exactly those off, so
 * the poster is shown whole, over a blurred copy of itself that fills the
 * frame, and opens full screen for reading the small print.
 */
export const EventPoster: React.FC<EventPosterProps> = ({ src, title }) => {
    const [failed, setFailed] = useState(false);
    const [open, setOpen] = useState<number | null>(null);
    const hasPoster = Boolean(src) && !failed;
    const image = hasPoster ? (src as string) : FALLBACK;

    const frame = (
        <>
            <img src={image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
            <img
                src={image}
                // A stock photo standing in for a missing poster is decoration, not the poster
                alt={hasPoster ? `Cartaz: ${title}` : ''}
                className="relative h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                onError={() => setFailed(true)}
            />
        </>
    );

    if (!hasPoster) {
        return <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-slate-900 md:h-96">{frame}</div>;
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(0)}
                className="group relative block h-72 w-full overflow-hidden rounded-2xl bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:h-96"
                aria-label={`Ver cartaz em ecrã inteiro: ${title}`}
            >
                {frame}
                {/* Always shown on touch screens, where there is no hover and zooming matters most */}
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                    <Maximize2 size={12} aria-hidden="true" /> Ver cartaz
                </span>
            </button>
            <Lightbox
                images={[{ src: image, alt: `Cartaz: ${title}` }]}
                index={open}
                onClose={() => setOpen(null)}
                onNavigate={setOpen}
                label={`Cartaz em ecrã inteiro: ${title}`}
            />
        </>
    );
};
