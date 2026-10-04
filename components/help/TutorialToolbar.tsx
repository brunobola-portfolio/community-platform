import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Link2, Printer, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TutorialToolbarProps {
    doneCount: number;
    stepCount: number;
    onReset: () => void;
    /** Absolute deep link to this guide; the copy button hides without it. */
    shareUrl?: string;
}

const ACTION = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-900/10 px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-500/40 hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white';

async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

/** Progress of the "Feito" ticks plus the two things people do with a guide: send it and print it. */
export const TutorialToolbar: React.FC<TutorialToolbarProps> = ({ doneCount, stepCount, onReset, shareUrl }) => {
    const [copyStatus, setCopyStatus] = useState('');
    const timer = useRef<number | undefined>(undefined);
    const complete = stepCount > 0 && doneCount === stepCount;

    useEffect(() => () => window.clearTimeout(timer.current), []);

    const copy = async () => {
        if (!shareUrl) return;
        const ok = await copyText(shareUrl);
        // Without clipboard access (old browser, insecure origin) the link is still readable to copy by hand
        setCopyStatus(ok ? 'Link copiado. Pode colá-lo numa mensagem.' : `Não foi possível copiar. O link é: ${shareUrl}`);
        window.clearTimeout(timer.current);
        if (ok) timer.current = window.setTimeout(() => setCopyStatus(''), 4000);
    };

    return (
        <div className="space-y-4 rounded-2xl border border-slate-900/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] print:hidden">
            <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {complete && <CheckCircle2 size={18} aria-hidden="true" className="text-brand-700 dark:text-brand-400" />}
                        {complete ? 'Guia concluído' : `${doneCount} de ${stepCount} passos feitos`}
                    </p>
                    {doneCount > 0 && (
                        <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
                            <RotateCcw size={15} aria-hidden="true" /> Recomeçar
                        </button>
                    )}
                </div>
                <div
                    role="progressbar"
                    aria-label="Progresso neste guia"
                    aria-valuemin={0}
                    aria-valuemax={stepCount}
                    aria-valuenow={doneCount}
                    aria-valuetext={`${doneCount} de ${stepCount} passos feitos`}
                    className="flex h-2.5 gap-1"
                >
                    {/* One segment per step, so the bar reads like the timeline below without any inline width */}
                    {Array.from({ length: stepCount }, (_, i) => (
                        <span key={i} className={cn('h-full flex-1 rounded-full transition-colors', i < doneCount ? 'bg-brand-700 dark:bg-brand-400' : 'bg-slate-900/10 dark:bg-white/15')} />
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                {shareUrl && (
                    <button type="button" onClick={() => void copy()} className={ACTION}>
                        <Link2 size={16} aria-hidden="true" /> Copiar link deste guia
                    </button>
                )}
                <button type="button" onClick={() => window.print()} className={ACTION}>
                    <Printer size={16} aria-hidden="true" /> Imprimir
                </button>
            </div>
            <p role="status" aria-live="polite" className={cn('text-sm text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200', !copyStatus && 'sr-only')}>{copyStatus}</p>
        </div>
    );
};
