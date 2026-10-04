import React, { useId, useMemo, useState } from 'react';
import { ArrowRight, Clock, ListChecks, MessageCircle, PlayCircle, Sparkles } from 'lucide-react';
import { Button } from '../ui/UIComponents';
import { Lightbox } from '../ui/Lightbox';
import { HelpContactAction } from './HelpContactCard';
import { HelpMediaFigure } from './HelpMediaFigure';
import { HelpPrintSheet } from './HelpPrintSheet';
import { HelpText } from './HelpText';
import { TutorialRelated } from './TutorialRelated';
import { TutorialStep } from './TutorialStep';
import { TutorialToolbar } from './TutorialToolbar';
import { useStepProgress } from './useStepProgress';
import { fillTokens } from '../../content/help';
import type { HelpContact } from './types';
import type { HelpTutorial } from '../../content/help';

interface TutorialReaderProps {
    tutorial: HelpTutorial;
    siteName: string;
    categoryTitle?: string;
    /** "Ir para <secção>" in the backoffice; absent on the public page. */
    goTo?: { label: string; onClick: () => void };
    prev?: HelpTutorial;
    next?: HelpTutorial;
    related?: HelpTutorial[];
    onSelect?: (id: string) => void;
    /** h1 when the guide is the page, h3 inside a dialog that already has its own title. */
    headingLevel?: 1 | 2 | 3;
    shareUrl?: string;
    contact?: HelpContact;
}

const CHIP = 'inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300';

/** One guide as a numbered timeline; shared by the backoffice, the contextual dialog and /ajuda. */
export const TutorialReader: React.FC<TutorialReaderProps> = ({
    tutorial, siteName, categoryTitle, goTo, prev, next, related = [], onSelect, headingLevel = 2, shareUrl, contact,
}) => {
    const Title = `h${headingLevel}` as const;
    const subLevel = (headingLevel + 1) as 2 | 3 | 4;
    const Sub = `h${subLevel}` as const;
    const idPrefix = useId();
    const { done, toggle, reset } = useStepProgress(tutorial.id, tutorial.steps.length);
    const [zoom, setZoom] = useState<number | null>(null);

    const media = tutorial.media ?? [];
    const images = useMemo(
        () => (tutorial.media ?? []).flatMap(m => (m.kind === 'image' ? [{ src: m.src, alt: m.alt, caption: m.alt }] : [])),
        [tutorial.media],
    );
    const hasVideo = media.some(m => m.kind === 'video');

    return (
        <article className="space-y-8">
            <header className="space-y-4">
                {categoryTitle && <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-400">{categoryTitle}</p>}
                <Title className="font-serif text-3xl leading-tight text-slate-900 [overflow-wrap:anywhere] [hyphens:auto] dark:text-white md:text-4xl">
                    {fillTokens(tutorial.title, { siteName })}
                </Title>
                <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">{fillTokens(tutorial.summary, { siteName })}</p>
                <div className="flex flex-wrap gap-2">
                    <span className={CHIP}><Clock size={13} aria-hidden="true" /> Cerca de {tutorial.minutes} min</span>
                    <span className={CHIP}><ListChecks size={13} aria-hidden="true" /> {tutorial.steps.length} passos</span>
                    {hasVideo && <span className={CHIP}><PlayCircle size={13} aria-hidden="true" /> Com vídeo</span>}
                </div>
                <p className="flex gap-3 rounded-2xl border border-brand-500/25 bg-brand-500/[0.07] p-4 text-base leading-relaxed text-slate-800 dark:text-slate-100">
                    <Sparkles size={18} aria-hidden="true" className="mt-1 shrink-0 text-brand-700 dark:text-brand-400" />
                    <span><b className="font-semibold text-brand-700 dark:text-brand-400">Em resumo: </b><HelpText text={tutorial.recap} siteName={siteName} /></span>
                </p>
            </header>

            <TutorialToolbar doneCount={done.length} stepCount={tutorial.steps.length} onReset={reset} shareUrl={shareUrl} />

            {media.map(m => (
                <HelpMediaFigure
                    key={m.src}
                    media={m}
                    onZoom={m.kind === 'image' ? () => setZoom(images.findIndex(i => i.src === m.src)) : undefined}
                />
            ))}

            <section aria-labelledby={`${idPrefix}-steps`} className="space-y-4">
                <Sub id={`${idPrefix}-steps`} className="font-serif text-xl text-slate-900 dark:text-white">Passo a passo</Sub>
                <ol className="list-none">
                    {tutorial.steps.map((step, index) => (
                        <TutorialStep
                            key={step.text}
                            step={step}
                            index={index}
                            isLast={index === tutorial.steps.length - 1}
                            done={done.includes(index)}
                            onToggle={toggle}
                            siteName={siteName}
                            idPrefix={idPrefix}
                        />
                    ))}
                </ol>
            </section>

            {goTo && (
                <div className="flex flex-col gap-3 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <p className="text-sm text-slate-700 dark:text-slate-300">Pronto para experimentar?</p>
                    <Button onClick={goTo.onClick} className="w-full sm:w-auto">{goTo.label} <ArrowRight size={16} aria-hidden="true" /></Button>
                </div>
            )}

            {onSelect && <TutorialRelated related={related} prev={prev} next={next} siteName={siteName} onSelect={onSelect} level={subLevel} />}

            {contact && (contact.href || contact.onClick) && (
                <p className="flex flex-wrap items-center gap-x-2 text-sm text-slate-600 dark:text-slate-400 print:hidden">
                    <MessageCircle size={16} aria-hidden="true" className="shrink-0" />
                    <span>Ficou com dúvidas?</span>
                    <HelpContactAction contact={contact} variant="link" />
                </p>
            )}

            <Lightbox images={images} index={zoom} onClose={() => setZoom(null)} onNavigate={setZoom} label="Imagem do guia em ecrã inteiro" />
            <HelpPrintSheet tutorial={tutorial} siteName={siteName} shareUrl={shareUrl} />
        </article>
    );
};
