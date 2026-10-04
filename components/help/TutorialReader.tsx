import React from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Clock, Lightbulb } from 'lucide-react';
import { Button } from '../ui/UIComponents';
import { HelpMediaFigure } from './HelpMediaFigure';
import { fillTokens } from '../../content/help';
import type { HelpStep, HelpTutorial } from '../../content/help';

interface TutorialReaderProps {
    tutorial: HelpTutorial;
    siteName: string;
    categoryTitle?: string;
    /** "Ir para <secção>" in the backoffice; absent on the public page. */
    goTo?: { label: string; onClick: () => void };
    prev?: HelpTutorial;
    next?: HelpTutorial;
    onSelect?: (id: string) => void;
    /** h1 when the guide is the page, h3 inside a dialog that already has its own title. */
    headingLevel?: 1 | 2 | 3;
}

interface StepItemProps {
    step: HelpStep;
    index: number;
    isLast: boolean;
    siteName: string;
}

const NOTE = 'mt-3 flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed';

const StepItem: React.FC<StepItemProps> = ({ step, index, isLast, siteName }) => (
    <li className="relative flex gap-4 pb-6 last:pb-0">
        {!isLast && <span aria-hidden="true" className="absolute left-4 top-9 h-[calc(100%-2.5rem)] w-px bg-slate-900/10 dark:bg-white/10" />}
        <span aria-hidden="true" className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 font-sans text-sm font-bold tabular-nums text-white shadow-[0_0_0_4px_rgb(var(--brand-600)/0.15)]">
            {index + 1}
        </span>
        <div className="min-w-0 flex-1 pt-1">
            <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
                <span className="sr-only">Passo {index + 1}: </span>{fillTokens(step.text, { siteName })}
            </p>
            {step.tip && (
                <p className={`${NOTE} border-brand-500/25 bg-brand-500/10 text-slate-700 dark:text-slate-200`}>
                    <Lightbulb size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-400" />
                    <span><b className="font-semibold text-brand-700 dark:text-brand-400">Dica: </b>{fillTokens(step.tip, { siteName })}</span>
                </p>
            )}
            {step.warning && (
                <p className={`${NOTE} border-amber-500/30 bg-amber-500/10 text-slate-700 dark:text-slate-200`}>
                    <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
                    <span><b className="font-semibold text-amber-800 dark:text-amber-300">Atenção: </b>{fillTokens(step.warning, { siteName })}</span>
                </p>
            )}
        </div>
    </li>
);

const NAV_BUTTON = 'group flex min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-slate-900/10 p-4 text-left transition-colors hover:border-brand-500/40 hover:bg-slate-900/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:hover:bg-white/[0.04]';

/** One tutorial as a numbered timeline; shared by the backoffice, the contextual dialog and /ajuda. */
export const TutorialReader: React.FC<TutorialReaderProps> = ({ tutorial, siteName, categoryTitle, goTo, prev, next, onSelect, headingLevel = 2 }) => {
    const Title = `h${headingLevel}` as const;
    return (
        <article className="space-y-8">
            <header className="space-y-3">
                {categoryTitle && <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-400">{categoryTitle}</p>}
                <Title className="font-serif text-3xl leading-tight text-slate-900 dark:text-white md:text-4xl">{fillTokens(tutorial.title, { siteName })}</Title>
                <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">{fillTokens(tutorial.summary, { siteName })}</p>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
                    <Clock size={13} aria-hidden="true" /> {tutorial.minutes} min · {tutorial.steps.length} passos
                </p>
            </header>

            {tutorial.media?.map(media => <HelpMediaFigure key={media.src} media={media} />)}

            <section aria-label="Passos">
                <ol className="list-none">
                    {tutorial.steps.map((step, index) => (
                        <StepItem key={step.text} step={step} index={index} isLast={index === tutorial.steps.length - 1} siteName={siteName} />
                    ))}
                </ol>
            </section>

            {goTo && (
                <div className="flex flex-col gap-3 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-700 dark:text-slate-300">Pronto para experimentar?</p>
                    <Button onClick={goTo.onClick} className="w-full sm:w-auto">{goTo.label} <ArrowRight size={16} aria-hidden="true" /></Button>
                </div>
            )}

            {onSelect && (prev || next) && (
                <nav aria-label="Outros guias" className="flex flex-col gap-3 border-t border-slate-900/10 pt-6 dark:border-white/10 sm:flex-row">
                    {prev && (
                        <button type="button" onClick={() => onSelect(prev.id)} className={NAV_BUTTON}>
                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400"><ArrowLeft size={13} aria-hidden="true" /> Anterior</span>
                            <span className="truncate font-medium text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-400">{fillTokens(prev.title, { siteName })}</span>
                        </button>
                    )}
                    {next && (
                        <button type="button" onClick={() => onSelect(next.id)} className={`${NAV_BUTTON} sm:items-end sm:text-right`}>
                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Seguinte <ArrowRight size={13} aria-hidden="true" /></span>
                            <span className="max-w-full truncate font-medium text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-400">{fillTokens(next.title, { siteName })}</span>
                        </button>
                    )}
                </nav>
            )}
        </article>
    );
};
