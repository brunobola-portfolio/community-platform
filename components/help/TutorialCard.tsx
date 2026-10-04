import React from 'react';
import { ChevronRight, Clock, PlayCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { fillTokens } from '../../content/help';
import type { HelpTutorial } from '../../content/help';

interface TutorialCardProps {
    tutorial: HelpTutorial;
    siteName: string;
    onSelect: (id: string) => void;
    /** Small label above the title, e.g. the category in search results. */
    eyebrow?: string;
    className?: string;
}

const hasVideo = (t: HelpTutorial) => Boolean(t.media?.some(m => m.kind === 'video'));

export const TutorialCard: React.FC<TutorialCardProps> = ({ tutorial, siteName, onSelect, eyebrow, className }) => (
    <button
        type="button"
        onClick={() => onSelect(tutorial.id)}
        className={cn(
            'group flex h-full w-full flex-col gap-2 rounded-2xl border border-slate-900/10 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-dark-surface dark:shadow-none',
            className,
        )}
    >
        {eyebrow && <span className="text-[11px] font-bold uppercase tracking-widest text-brand-700 dark:text-brand-400">{eyebrow}</span>}
        <span className="font-serif text-lg leading-snug text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-400">
            {fillTokens(tutorial.title, { siteName })}
        </span>
        <span className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{fillTokens(tutorial.summary, { siteName })}</span>
        <span className="mt-auto flex items-center gap-3 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1"><Clock size={13} aria-hidden="true" /> {tutorial.minutes} min</span>
            {hasVideo(tutorial) && <span className="inline-flex items-center gap-1"><PlayCircle size={13} aria-hidden="true" /> Com vídeo</span>}
            <ChevronRight size={16} aria-hidden="true" className="ml-auto transition-transform group-hover:translate-x-0.5" />
        </span>
    </button>
);
