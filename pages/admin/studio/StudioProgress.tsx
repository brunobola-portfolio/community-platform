import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { STAGE_LABEL, type StageId } from './studioCopy';

interface StudioProgressProps {
    stages: StageId[];
    current: StageId;
    /** Expected wait for the chosen image engine. */
    hint: string;
}

/** Staged checklist shown while the draft is prepared; announced politely to screen readers. */
export const StudioProgress: React.FC<StudioProgressProps> = ({ stages, current, hint }) => {
    const currentIndex = stages.indexOf(current);
    return (
        <div className="rounded-2xl border border-brand-500/20 bg-brand-500/[0.06] p-5">
            <p className="sr-only" role="status" aria-live="polite">{STAGE_LABEL[current]}</p>
            <ol className="space-y-3">
                {stages.map((stage, index) => {
                    const done = index < currentIndex;
                    const active = index === currentIndex;
                    return (
                        <li key={stage} className="flex items-center gap-3">
                            <span className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 transition-colors',
                                done && 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
                                active && 'bg-brand-500/20 text-brand-300 ring-brand-500/40',
                                !done && !active && 'bg-white/5 text-slate-600 ring-white/10',
                            )}>
                                {done ? <Check size={14} /> : active ? <Loader2 size={14} className="animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                            </span>
                            <span className={cn('text-sm', active ? 'font-semibold text-white' : done ? 'text-slate-300' : 'text-slate-400')}>
                                {STAGE_LABEL[stage].replace('…', '')}
                            </span>
                        </li>
                    );
                })}
            </ol>
            <p className="mt-4 text-xs text-slate-400">{hint} Pode cancelar a qualquer momento.</p>
        </div>
    );
};
