import React, { useLayoutEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { applyBrandVariables, extraFonts, resolveBrand, syncFontStylesheet } from '../../../utils/brandDom';

interface BrandPreviewProps {
    color?: string;
    heading?: string;
    body?: string;
}

// Separate from the live site's stylesheet so trying fonts here never changes
// what the rest of the backoffice renders before the admin saves
const PREVIEW_FONT_LINK_ID = 'brand-fonts-preview';

interface ThemeSampleProps {
    tone: 'light' | 'dark';
}

// Mirrors the classes the public site uses for each theme. The backoffice root
// carries `dark`, so the light sample spells its colours out instead of
// relying on dark: variants
const SAMPLE_CLASSES = {
    light: {
        surface: 'bg-white border-slate-900/10',
        label: 'text-slate-500',
        badge: 'bg-brand-500/10 text-brand-700',
        title: 'text-slate-900',
        text: 'text-slate-600',
        link: 'text-brand-700',
    },
    dark: {
        surface: 'bg-dark-surface border-white/10',
        label: 'text-slate-400',
        badge: 'bg-brand-500/15 text-brand-400',
        title: 'text-white',
        text: 'text-slate-300',
        link: 'text-brand-400',
    },
} as const;

const ThemeSample: React.FC<ThemeSampleProps> = ({ tone }) => {
    const c = SAMPLE_CLASSES[tone];
    return (
        <div className={cn('rounded-xl border p-5 space-y-3 font-sans', c.surface)}>
            <p className={cn('text-[10px] font-mono uppercase tracking-widest', c.label)}>
                {tone === 'light' ? 'Tema claro' : 'Tema escuro'}
            </p>
            <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider', c.badge)}>
                Próximo evento
            </span>
            <h4 className={cn('font-serif text-2xl font-bold leading-tight', c.title)}>Festa de Verão</h4>
            <p className={cn('text-sm leading-relaxed', c.text)}>
                Música ao vivo, petiscos e jogos para toda a família no largo da sede.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
                <span className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
                    Inscrever-me <ArrowRight size={14} />
                </span>
                <span className={cn('text-sm font-semibold underline underline-offset-4', c.link)}>Ver agenda</span>
            </div>
        </div>
    );
};

/**
 * Live preview of an unsaved brand. The palette and font variables are set on
 * this container only, so Tailwind's brand classes inside resolve to the
 * preview values while the backoffice keeps the saved brand.
 */
export const BrandPreview: React.FC<BrandPreviewProps> = ({ color, heading, body }) => {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const brand = resolveBrand(color, heading, body);
        if (ref.current) applyBrandVariables(ref.current, brand);
        syncFontStylesheet(PREVIEW_FONT_LINK_ID, extraFonts(brand));
    }, [color, heading, body]);

    useLayoutEffect(() => () => syncFontStylesheet(PREVIEW_FONT_LINK_ID, []), []);

    return (
        <div ref={ref} className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Pré-visualização da marca" role="group">
            <ThemeSample tone="light" />
            <ThemeSample tone="dark" />
        </div>
    );
};
