import React, { useId } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Clock } from 'lucide-react';
import { fillTokens } from '../../content/help';
import type { HelpTutorial } from '../../content/help';
import { cn } from '../../utils/cn';

interface TutorialRelatedProps {
    related: HelpTutorial[];
    prev?: HelpTutorial;
    next?: HelpTutorial;
    siteName: string;
    onSelect: (id: string) => void;
    /** Heading level of the "Guias relacionados" title, one below the guide title. */
    level: 2 | 3 | 4;
}

const TITLE = 'min-w-0 font-medium text-slate-900 [overflow-wrap:anywhere] group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-400';
const NAV_BUTTON = 'group flex min-h-11 w-full min-w-0 flex-1 flex-col gap-1 rounded-2xl border border-slate-900/10 p-4 text-left transition-colors hover:border-brand-500/40 hover:bg-slate-900/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:hover:bg-white/[0.04]';

/** What to read next: a few related guides, then the previous and next guide in reading order. */
export const TutorialRelated: React.FC<TutorialRelatedProps> = ({ related, prev, next, siteName, onSelect, level }) => {
    const Heading = `h${level}` as const;
    const headingId = useId();
    return (
        <div className="space-y-6 print:hidden">
            {related.length > 0 && (
                <section aria-labelledby={headingId} className="space-y-3">
                    <Heading id={headingId} className="font-serif text-xl text-slate-900 dark:text-white">Guias relacionados</Heading>
                    <ul className="grid gap-2">
                        {related.map(t => (
                            <li key={t.id}>
                                <button type="button" onClick={() => onSelect(t.id)} className={cn(NAV_BUTTON, 'flex-row items-center gap-3')}>
                                    <span className={cn(TITLE, 'flex-1')}>{fillTokens(t.title, { siteName })}</span>
                                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400"><Clock size={13} aria-hidden="true" /> {t.minutes} min</span>
                                    <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-slate-500 dark:text-slate-400" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            {(prev || next) && (
                <nav aria-label="Guia anterior e seguinte" className="flex flex-col gap-3 border-t border-slate-900/10 pt-6 dark:border-white/10 sm:flex-row">
                    {prev && (
                        <button type="button" onClick={() => onSelect(prev.id)} className={NAV_BUTTON}>
                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400"><ArrowLeft size={13} aria-hidden="true" /> Anterior</span>
                            <span className={TITLE}>{fillTokens(prev.title, { siteName })}</span>
                        </button>
                    )}
                    {next && (
                        <button type="button" onClick={() => onSelect(next.id)} className={cn(NAV_BUTTON, 'sm:items-end sm:text-right')}>
                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Seguinte <ArrowRight size={13} aria-hidden="true" /></span>
                            <span className={TITLE}>{fillTokens(next.title, { siteName })}</span>
                        </button>
                    )}
                </nav>
            )}
        </div>
    );
};
