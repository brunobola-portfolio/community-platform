import React, { useEffect, useRef } from 'react';
import { ArrowLeft, FileQuestion } from 'lucide-react';

interface HelpNotFoundProps {
    onClear: () => void;
}

/**
 * A `?ajuda=` link to a guide that was renamed, removed or belongs to the other
 * audience. Shown above the full list instead of a blank page, and focused so a
 * screen reader announces why the guide did not open.
 */
export const HelpNotFound: React.FC<HelpNotFoundProps> = ({ onClear }) => {
    const headingRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => { headingRef.current?.focus(); }, []);

    return (
        <section aria-labelledby="help-not-found" className="flex flex-col gap-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex gap-3">
                <FileQuestion size={24} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-800 dark:text-amber-300" />
                <div className="space-y-1">
                    <h2 id="help-not-found" ref={headingRef} tabIndex={-1} className="font-serif text-xl text-slate-900 outline-none dark:text-white">Não encontrámos esse guia</h2>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">O link pode estar desatualizado ou o guia mudou de nome. Escolha um dos guias abaixo ou pesquise.</p>
                </div>
            </div>
            <button
                type="button"
                onClick={onClear}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-900/15 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-brand-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/15 dark:bg-dark-surface dark:text-slate-100"
            >
                <ArrowLeft size={16} aria-hidden="true" /> Ver todos os guias
            </button>
        </section>
    );
};
