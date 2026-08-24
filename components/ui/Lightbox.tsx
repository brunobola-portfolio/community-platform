import React, { useCallback, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  /** Index of the open image; null keeps the lightbox closed */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Full-bleed image viewer shared across Gallery, Team and History.
 * Controlled component: the parent owns the open index and navigation.
 */
export const Lightbox: React.FC<LightboxProps> = ({ images, index, onClose, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen = index !== null && index >= 0 && index < images.length;
  const current = isOpen ? images[index] : null;

  const goPrev = useCallback(() => {
    if (index !== null && index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  const goNext = useCallback(() => {
    if (index !== null && index < images.length - 1) onNavigate(index + 1);
  }, [index, images.length, onNavigate]);

  // Keyboard navigation, focus management and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement;
    containerRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case 'ArrowLeft': goPrev(); break;
        case 'ArrowRight': goNext(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      previousFocus?.focus();
    };
  }, [isOpen, onClose, goPrev, goNext]);

  if (!isOpen || !current) return null;

  const controlClasses = "text-white/60 hover:text-white p-2 rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Visualização de fotografia em ecrã inteiro"
      tabIndex={-1}
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-fade-in-up"
      onClick={onClose}
    >
      <button
        aria-label="Fechar"
        className={`absolute top-6 right-6 z-10 ${controlClasses}`}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X size={32} />
      </button>

      {images.length > 1 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/60 text-sm font-mono bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
          {index + 1} / {images.length}
        </div>
      )}

      {index > 0 && (
        <button
          aria-label="Foto anterior"
          className={`absolute left-4 sm:left-8 z-10 ${controlClasses}`}
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
        >
          <ChevronLeft size={40} />
        </button>
      )}

      <figure className="flex flex-col items-center gap-4 max-w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.src}
          alt={current.alt}
          className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
        />
        {current.caption && (
          <figcaption className="text-white/80 text-sm font-medium bg-black/40 px-5 py-2 rounded-full backdrop-blur-sm text-center">
            {current.caption}
          </figcaption>
        )}
      </figure>

      {index < images.length - 1 && (
        <button
          aria-label="Próxima foto"
          className={`absolute right-4 sm:right-8 z-10 ${controlClasses}`}
          onClick={(e) => { e.stopPropagation(); goNext(); }}
        >
          <ChevronRight size={40} />
        </button>
      )}
    </div>
  );
};
