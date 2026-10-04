import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { HelpHome } from './HelpHome';
import { HelpNotFound } from './HelpNotFound';
import { HelpResults } from './HelpResults';
import { HelpSearchField } from './HelpSearchField';
import { TutorialReader } from './TutorialReader';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { fillTokens, getCategory, HELP_PARAM, relatedTutorials, searchHelp } from '../../content/help';
import { helpLink } from '../../content/help/format';
import type { HelpContact, HelpHero } from './types';
import type { HelpCategory, HelpTutorial } from '../../content/help';
import { cn } from '../../utils/cn';

interface HelpCenterProps {
    tutorials: HelpTutorial[];
    categories: HelpCategory[];
    siteName: string;
    /** Raw `?ajuda=` value; an id outside `tutorials` shows the not-found notice. */
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    goToFor?: (tutorial: HelpTutorial) => { label: string; onClick: () => void } | undefined;
    hero: HelpHero;
    /** Path the deep links point at: /ajuda on the site, /admin in the backoffice. */
    linkPath: string;
    contact?: HelpContact;
    /** "Comece por aqui" guides; defaults to every guide flagged as featured. */
    featured?: HelpTutorial[];
    /** Rendered under the topics on the landing view (e.g. the contacts on /ajuda). */
    footer?: React.ReactNode;
}

interface TopicNavProps {
    title?: string;
    siblings: HelpTutorial[];
    selectedId: string;
    siteName: string;
    onOpen: (id: string) => void;
}

const BACK = 'inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white print:hidden';

const TopicNav: React.FC<TopicNavProps> = ({ title, siblings, selectedId, siteName, onOpen }) => (
    <nav aria-label="Guias deste tema" className="hidden lg:block print:hidden">
        <div className="sticky top-28 space-y-1 rounded-2xl border border-slate-900/10 p-4 dark:border-white/10">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">{title}</p>
            {siblings.map(t => (
                <button
                    key={t.id}
                    type="button"
                    onClick={() => onOpen(t.id)}
                    aria-current={t.id === selectedId ? 'page' : undefined}
                    className={cn(
                        'block w-full rounded-xl px-2 py-2 text-left text-sm transition-colors [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                        t.id === selectedId ? 'bg-brand-500/10 font-semibold text-brand-700 dark:text-brand-300' : 'text-slate-700 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5',
                    )}
                >
                    {fillTokens(t.title, { siteName })}
                </button>
            ))}
        </div>
    </nav>
);

/** Search, landing and reader of the help center; the host page owns the selected guide (URL). */
export const HelpCenter: React.FC<HelpCenterProps> = ({ tutorials, categories, siteName, selectedId, onSelect, goToFor, hero, linkPath, contact, featured, footer }) => {
    const [query, setQuery] = useState('');
    const debounced = useDebouncedValue(query.trim(), 500);
    const topRef = useRef<HTMLDivElement>(null);
    const readerRef = useRef<HTMLDivElement>(null);

    const selected = tutorials.find(t => t.id === selectedId);
    const notFound = Boolean(selectedId) && !selected;
    const results = useMemo(() => (debounced ? searchHelp(tutorials, debounced) : []), [tutorials, debounced]);

    useEffect(() => {
        if (!selected) return;
        topRef.current?.scrollIntoView({ block: 'start' });
        readerRef.current?.focus({ preventScroll: true });
    }, [selected]);

    const open = (id: string) => { setQuery(''); onSelect(id); };

    if (selected) {
        const index = tutorials.indexOf(selected);
        const category = getCategory(selected.category);
        return (
            <div ref={topRef} className="scroll-mt-28 space-y-6">
                <button type="button" onClick={() => onSelect(null)} className={BACK}><ArrowLeft size={16} aria-hidden="true" /> Todos os guias</button>
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div ref={readerRef} tabIndex={-1} className="min-w-0 outline-none">
                        <TutorialReader
                            tutorial={selected}
                            siteName={siteName}
                            categoryTitle={category?.title}
                            goTo={goToFor?.(selected)}
                            prev={tutorials[index - 1]}
                            next={tutorials[index + 1]}
                            related={relatedTutorials(tutorials, selected)}
                            onSelect={open}
                            headingLevel={1}
                            shareUrl={helpLink(window.location.origin, linkPath, HELP_PARAM, selected.id)}
                            contact={contact}
                        />
                    </div>
                    <TopicNav title={category?.title} siblings={tutorials.filter(t => t.category === selected.category)} selectedId={selected.id} siteName={siteName} onOpen={open} />
                </div>
            </div>
        );
    }

    return (
        <div ref={topRef} className="space-y-10 sm:space-y-12">
            <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4 py-8 dark:border-white/10 dark:from-brand-950/70 dark:via-dark-surface dark:to-dark-bg sm:px-6 sm:py-10 md:px-12 md:py-14">
                <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
                <div className="relative max-w-2xl space-y-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700 dark:text-brand-400">{hero.eyebrow}</p>
                    <h1 className="font-serif text-3xl leading-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">{fillTokens(hero.title, { siteName })}</h1>
                    <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">{fillTokens(hero.text, { siteName })}</p>
                    <div className="pt-2"><HelpSearchField value={query} onChange={setQuery} placeholder={hero.placeholder} /></div>
                    <p role="status" aria-live="polite" className="sr-only">
                        {debounced ? `${results.length} ${results.length === 1 ? 'guia encontrado' : 'guias encontrados'}` : ''}
                    </p>
                </div>
            </div>
            {notFound && !debounced && <HelpNotFound onClear={() => onSelect(null)} />}
            {debounced
                ? <HelpResults query={debounced} results={results} siteName={siteName} suggestions={hero.suggestions} contact={contact} onSelect={open} onSuggest={setQuery} />
                : <HelpHome tutorials={tutorials} featured={featured ?? tutorials.filter(t => t.featured)} categories={categories} siteName={siteName} onSelect={open} />}
            {!debounced && footer}
        </div>
    );
};
