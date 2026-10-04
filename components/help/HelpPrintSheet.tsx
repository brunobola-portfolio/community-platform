import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpText } from './HelpText';
import { fillTokens } from '../../content/help';
import type { HelpTutorial } from '../../content/help';

interface HelpPrintSheetProps {
    tutorial: HelpTutorial;
    siteName: string;
    shareUrl?: string;
}

/*
 * Printing hides every child of <body> except this sheet. The rule is a Tailwind
 * arbitrary variant on <body>, so it needs no global CSS and only exists while a
 * guide is on screen; a counter keeps it when a dialog and the page both show one.
 */
const BODY_CLASSES = ['print:[&>*:not(.help-print-sheet)]:!hidden', 'print:!bg-white'];
let mounted = 0;

const BOLD = 'font-bold text-black dark:text-black';

/** Paper version of a guide: light, numbered, no navigation, no media. */
export const HelpPrintSheet: React.FC<HelpPrintSheetProps> = ({ tutorial, siteName, shareUrl }) => {
    useEffect(() => {
        mounted += 1;
        document.body.classList.add(...BODY_CLASSES);
        return () => {
            mounted -= 1;
            if (mounted === 0) document.body.classList.remove(...BODY_CLASSES);
        };
    }, []);

    return createPortal(
        <div className="help-print-sheet hidden bg-white p-0 font-sans text-black print:block" aria-hidden="true">
            <p className="text-xs uppercase tracking-widest text-black">{siteName} · Ajuda</p>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-black">{fillTokens(tutorial.title, { siteName })}</h1>
            <p className="mt-2 text-sm text-black">{fillTokens(tutorial.summary, { siteName })} ({tutorial.minutes} min)</p>
            <p className="mt-4 border-l-4 border-black pl-3 text-sm text-black"><b>Em resumo: </b><HelpText text={tutorial.recap} siteName={siteName} boldClassName={BOLD} /></p>
            <ol className="mt-6 list-none space-y-4">
                {tutorial.steps.map((step, i) => (
                    <li key={step.text} className="flex break-inside-avoid gap-3 text-base text-black">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-black text-sm font-bold">{i + 1}</span>
                        <div className="min-w-0 space-y-1 pt-0.5">
                            <p><HelpText text={step.text} siteName={siteName} boldClassName={BOLD} /></p>
                            {step.why && <p className="text-sm"><b>Porquê: </b><HelpText text={step.why} siteName={siteName} boldClassName={BOLD} /></p>}
                            {step.tip && <p className="text-sm"><b>Dica: </b><HelpText text={step.tip} siteName={siteName} boldClassName={BOLD} /></p>}
                            {step.warning && <p className="text-sm"><b>Atenção: </b><HelpText text={step.warning} siteName={siteName} boldClassName={BOLD} /></p>}
                            <p className="text-sm">☐ Feito</p>
                        </div>
                    </li>
                ))}
            </ol>
            {shareUrl && <p className="mt-8 border-t border-black pt-3 text-xs text-black [overflow-wrap:anywhere]">Versão online, com vídeo e imagens: {shareUrl}</p>}
        </div>,
        document.body,
    );
};
