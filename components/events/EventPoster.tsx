import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Lightbox } from '../ui/Lightbox';

interface EventPosterProps {
    src?: string;
    alt: string;
}

const FALLBACK = 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop';

/**
 * Event images are usually posters: portrait, with the date and the details
 * printed at the top and the bottom. A cover crop cuts exactly those off, so
 * the poster is shown whole, over a blurred copy of itself that fills the
 * frame, and opens full screen for reading the small print.
 */
export const EventPoster: React.FC<EventPosterProps> = ({ src, alt }) => {
    const [image, setImage] = useState(src || FALLBACK);
    const [open, setOpen] = useState<number | null>(null);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(0)}
                className="group relative block h-72 w-full overflow-hidden rounded-2xl bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:h-96"
                aria-label={`Ver cartaz em ecrã inteiro: ${alt}`}
            >
                <img src={image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
                <img
                    src={image}
                    alt={alt}
                    className="relative h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={() => setImage(FALLBACK)}
                />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Maximize2 size={12} aria-hidden="true" /> Ver cartaz
                </span>
            </button>
            <Lightbox
                images={[{ src: image, alt }]}
                index={open}
                onClose={() => setOpen(null)}
                onNavigate={setOpen}
            />
        </>
    );
};
