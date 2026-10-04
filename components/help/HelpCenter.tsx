import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, SearchX } from 'lucide-react';
import { HelpHome } from './HelpHome';
import { HelpSearchField } from './HelpSearchField';
import { TutorialCard } from './TutorialCard';
import { TutorialReader } from './TutorialReader';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { fillTokens, getCategory, searchHelp } from '../../content/help';
import type { HelpCategory, HelpTutorial } from '../../content/help';
import { cn } from '../../utils/cn';

interface HelpCenterProps {
    tutorials: HelpTutorial[];
    categories: HelpCategory[];
    siteName: string;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    goToFor?: (tutorial: HelpTutorial) => { label: string; onClick: () => void } | undefined;
    hero: { eyebrow: string; title: string; text: string; placeholder: string };
    /** Rendered under the topics on the landing view (e.g. the contacts on /ajuda). */
    footer?: React.ReactNode;
}

const BACK = 'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white';

interface ResultsProps {
    query: string;
    results: HelpTutorial[];
    siteName: string;
    onSelect: (id: string) => void;
}

const Results: React.FC<ResultsProps> = ({ query, results, siteName, onSelect }) => (
    <section aria-labelledby="help-results" className="space-y-4">
        <h2 id="help-results" className="font-serif text-2xl text-slate-900 dark:text-white">
            {results.length ? `${results.length} ${results.length === 1 ? 'guia' : 'guias'} para «${query}»` : `Sem resultados para «${query}»`}
        </h2>
        {results.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.map(t => <TutorialCard key={t.id} tutorial={t} siteName={siteName} onSelect={onSelect} eyebrow={getCategory(t.category)?.title} />)}
            </div>
        ) : (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-900/15 px-6 py-12 text-center dark:border-white/15">
                <SearchX size={32} aria-hidden="true" className="text-slate-500 dark:text-slate-400" />
                <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">Experimente uma palavra mais simples, como «inscrições», «quota» ou «palavra-passe».</p>
            </div>
        )}
    </section>
);

/** Search, landing and reader of the help center; the host page owns the selected guide (URL). */
export const HelpCenter: React.FC<HelpCenterProps> = ({ tutorials, categories, siteName, selectedId, onSelect, goToFor, hero, footer }) => {
    const [query, setQuery] = useState('');
    const debounced = useDebouncedValue(query.trim(), 500);
    const topRef = useRef<HTMLDivElement>(null);
    const readerRef = useRef<HTMLDivElement>(null);

    const selected = tutorials.find(t => t.id === selectedId);
    const results = useMemo(() => (debounced ? searchHelp(tutorials, debounced) : []), [tutorials, debounced]);
    const index = selected ? tutorials.indexOf(selected) : -1;
    const siblings = selected ? tutorials.filter(t => t.category === selected.category) : [];

    useEffect(() => {
        if (!selected) return;
        topRef.current?.scrollIntoView({ block: 'start' });
        readerRef.current?.focus({ preventScroll: true });
    }, [selected]);

    const open = (id: string) => { setQuery(''); onSelect(id); };

    if (selected) {
        return (
            <div ref={topRef} className="scroll-mt-24 space-y-6">
                <button type="button" onClick={() => onSelect(null)} className={BACK}><ArrowLeft size={16} aria-hidden="true" /> Todos os guias</button>
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div ref={readerRef} tabIndex={-1} className="min-w-0 outline-none">
                        <TutorialReader
                            tutorial={selected}
                            siteName={siteName}
                            categoryTitle={getCategory(selected.category)?.title}
                            goTo={goToFor?.(selected)}
                            prev={tutorials[index - 1]}
                            next={tutorials[index + 1]}
                            onSelect={open}
                            headingLevel={1}
                        />
                    </div>
                    <nav aria-label="Guias deste tema" className="hidden lg:block">
                        <div className="sticky top-6 space-y-2 rounded-2xl border border-slate-900/10 p-4 dark:border-white/10">
                            <p className="px-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">{getCategory(selected.category)?.title}</p>
                            {siblings.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => open(t.id)}
                                    aria-current={t.id === selected.id ? 'page' : undefined}
                                    className={cn(
                                        'block w-full rounded-xl px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                                        t.id === selected.id ? 'bg-brand-500/10 font-semibold text-brand-700 dark:text-brand-300' : 'text-slate-700 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5',
                                    )}
                                >
                                    {fillTokens(t.title, { siteName })}
                                </button>
                            ))}
                        </div>
                    </nav>
                </div>
            </div>
        );
    }

    return (
        <div ref={topRef} className="space-y-12">
            <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-gradient-to-br from-brand-50 via-white to-slate-50 px-6 py-10 dark:border-white/10 dark:from-brand-950/70 dark:via-dark-surface dark:to-dark-bg md:px-12 md:py-14">
                <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
                <div className="relative max-w-2xl space-y-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-400">{hero.eyebrow}</p>
                    <h1 className="font-serif text-4xl leading-tight text-slate-900 dark:text-white md:text-5xl">{fillTokens(hero.title, { siteName })}</h1>
                    <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">{fillTokens(hero.text, { siteName })}</p>
                    <div className="pt-2"><HelpSearchField value={query} onChange={setQuery} placeholder={hero.placeholder} /></div>
                    <p role="status" className="sr-only">{debounced ? `${results.length} resultados` : ''}</p>
                </div>
            </div>
            {debounced
                ? <Results query={debounced} results={results} siteName={siteName} onSelect={open} />
                : <HelpHome tutorials={tutorials} categories={categories} siteName={siteName} onSelect={open} />}
            {!debounced && footer}
        </div>
    );
};
