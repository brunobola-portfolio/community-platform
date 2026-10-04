import React from 'react';
import { AlertTriangle, Check, HelpCircle, Lightbulb } from 'lucide-react';
import { HelpText } from './HelpText';
import { cn } from '../../utils/cn';
import type { HelpStep } from '../../content/help';

interface TutorialStepProps {
    step: HelpStep;
    index: number;
    isLast: boolean;
    done: boolean;
    onToggle: (index: number) => void;
    siteName: string;
    /** Prefix that keeps checkbox ids unique when a dialog and the page show guides at once. */
    idPrefix: string;
}

interface StepNoteProps {
    kind: 'why' | 'tip' | 'warning';
    text: string;
    siteName: string;
}

const NOTE_STYLES = {
    why: { label: 'Porquê: ', Icon: HelpCircle, box: 'border-slate-900/10 bg-slate-900/[0.03] dark:border-white/10 dark:bg-white/[0.04]', accent: 'text-slate-800 dark:text-slate-100' },
    tip: { label: 'Dica: ', Icon: Lightbulb, box: 'border-brand-500/25 bg-brand-500/10', accent: 'text-brand-700 dark:text-brand-400' },
    warning: { label: 'Atenção: ', Icon: AlertTriangle, box: 'border-amber-500/30 bg-amber-500/10', accent: 'text-amber-800 dark:text-amber-300' },
} as const;

const StepNote: React.FC<StepNoteProps> = ({ kind, text, siteName }) => {
    const { label, Icon, box, accent } = NOTE_STYLES[kind];
    return (
        <p className={cn('mt-3 flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200', box)}>
            <Icon size={16} aria-hidden="true" className={cn('mt-0.5 shrink-0', accent)} />
            <span className="min-w-0"><b className={cn('font-semibold', accent)}>{label}</b><HelpText text={text} siteName={siteName} /></span>
        </p>
    );
};

/** One step of the timeline: the action, its notes and a "Feito" tick big enough for a thumb. */
export const TutorialStep: React.FC<TutorialStepProps> = ({ step, index, isLast, done, onToggle, siteName, idPrefix }) => {
    const checkboxId = `${idPrefix}-step-${index}`;
    return (
        <li className="relative flex gap-3 pb-4 last:pb-0 sm:gap-4">
            {!isLast && <span aria-hidden="true" className="absolute bottom-0 left-[1.1875rem] top-11 w-0.5 rounded-full bg-slate-900/10 dark:bg-white/10" />}
            <span
                aria-hidden="true"
                className={cn(
                    'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-sans text-base font-bold tabular-nums transition-colors',
                    done ? 'bg-brand-500/15 text-brand-700 ring-2 ring-brand-500/40 dark:text-brand-300' : 'bg-brand-700 text-white shadow-[0_0_0_4px_rgb(var(--brand-600)/0.15)]',
                )}
            >
                {done ? <Check size={20} strokeWidth={3} /> : index + 1}
            </span>
            <div
                className={cn(
                    'min-w-0 flex-1 rounded-2xl border p-4 transition-colors',
                    done ? 'border-brand-500/25 bg-brand-500/[0.04]' : 'border-slate-900/10 bg-white dark:border-white/10 dark:bg-white/[0.03]',
                )}
            >
                <p className="text-base leading-relaxed text-slate-800 [overflow-wrap:anywhere] dark:text-slate-100">
                    <span className="sr-only">Passo {index + 1}: </span>
                    <HelpText text={step.text} siteName={siteName} />
                </p>
                {step.why && <StepNote kind="why" text={step.why} siteName={siteName} />}
                {step.tip && <StepNote kind="tip" text={step.tip} siteName={siteName} />}
                {step.warning && <StepNote kind="warning" text={step.warning} siteName={siteName} />}
                <label
                    htmlFor={checkboxId}
                    className="mt-3 inline-flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-xl border border-slate-900/10 px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-900/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                    <input
                        id={checkboxId}
                        type="checkbox"
                        checked={done}
                        onChange={() => onToggle(index)}
                        className="h-5 w-5 shrink-0 cursor-pointer rounded accent-brand-700 focus-visible:outline-none"
                    />
                    {done ? 'Feito' : 'Marcar como feito'}
                    <span className="sr-only">: passo {index + 1}</span>
                </label>
            </div>
        </li>
    );
};
