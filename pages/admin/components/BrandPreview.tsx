import React, { useLayoutEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { applyBrandVariables, extraFonts, resolveBrand, syncFontStylesheet } from '../../../utils/brandDom';

interface BrandPreviewProps {
    color?: string;
    accent?: string;
    heading?: string;
    body?: string;
    mono?: string;
}

// Separate from the live site's stylesheet so trying fonts here never changes
// what the rest of the backoffice renders before the admin saves
const PREVIEW_FONT_LINK_ID = 'brand-fonts-preview';

interface ThemeSampleProps {
    tone: 'light' | 'dark';
}

// Mirrors the classes the public site uses for each theme. The backoffice root
// carries `dark`, so the light sample spells its colours out instead of
// relying on dark: variants, and each sample re-resolves the display token
// through its brand-scope class
const SAMPLE_CLASSES = {
    light: {
        scope: 'brand-scope-light',
        surface: 'bg-slate-50 border-slate-900/10',
        label: 'text-slate-600',
        badge: 'bg-brand-500/10 text-brand-700',
        title: 'text-slate-900',
        gradientEnd: 'to-accent-600',
        text: 'text-slate-600',
        link: 'text-brand-700',
    },
    dark: {
        scope: 'brand-scope-dark',
        surface: 'bg-dark-bg border-white/10',
        label: 'text-slate-400',
        badge: 'bg-brand-500/15 text-brand-400',
        title: 'text-white',
        gradientEnd: 'to-accent-400',
        text: 'text-slate-300',
        link: 'text-brand-400',
    },
} as const;

const ThemeSample: React.FC<ThemeSampleProps> = ({ tone }) => {
    const c = SAMPLE_CLASSES[tone];
    return (
        <div className={cn('rounded-xl border p-5 space-y-3 font-sans', c.scope, c.surface)}>
            <p className={cn('text-[10px] font-mono uppercase tracking-widest', c.label)}>
                {tone === 'light' ? 'Tema claro' : 'Tema escuro'} · 12 jul 2026
            </p>
            <h4 className={cn('font-serif text-3xl font-bold leading-tight', c.title)}>
                Festa de <span className="italic text-brand-display">Verão</span>
            </h4>
            <p className={cn('font-serif text-xl leading-tight', c.title)}>
                Eventos & <span className={cn('text-transparent bg-clip-text bg-gradient-to-r from-brand-display', c.gradientEnd)}>Atividades</span>
            </p>
            <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider', c.badge)}>
                Próximo evento
            </span>
            <p className={cn('text-sm leading-relaxed', c.text)}>
                Música ao vivo, petiscos e jogos para toda a família no largo da sede.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
                <span className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
                    Inscrever-me <ArrowRight size={14} />
                </span>
                <span className={cn('text-sm font-semibold underline underline-offset-4', c.link)}>Ver agenda</span>
            </div>
            <div className="h-1 rounded-full bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500" aria-hidden="true" />
        </div>
    );
};

/**
 * Live preview of an unsaved brand. Every brand variable (scales, neutrals,
 * accent, display, fonts) is set on this container only, so Tailwind classes
 * inside resolve to the preview values while the backoffice keeps the saved
 * brand.
 */
export const BrandPreview: React.FC<BrandPreviewProps> = ({ color, accent, heading, body, mono }) => {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const brand = resolveBrand({ color, accent, heading, body, mono });
        if (ref.current) applyBrandVariables(ref.current, brand);
        syncFontStylesheet(PREVIEW_FONT_LINK_ID, extraFonts(brand));
    }, [color, accent, heading, body, mono]);

    useLayoutEffect(() => () => syncFontStylesheet(PREVIEW_FONT_LINK_ID, []), []);

    return (
        <div ref={ref} className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Pré-visualização da marca" role="group">
            <ThemeSample tone="light" />
            <ThemeSample tone="dark" />
        </div>
    );
};
