import React from 'react';
import { SearchX } from 'lucide-react';
import { HelpContactCard } from './HelpContactCard';
import { TutorialCard } from './TutorialCard';
import { getCategory } from '../../content/help';
import type { HelpContact } from './types';
import type { HelpTutorial } from '../../content/help';

interface HelpResultsProps {
    query: string;
    results: HelpTutorial[];
    siteName: string;
    suggestions: string[];
    contact?: HelpContact;
    onSelect: (id: string) => void;
    onSuggest: (term: string) => void;
}

const CHIP = 'inline-flex min-h-11 items-center rounded-full border border-slate-900/15 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors hover:border-brand-500/50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/15 dark:bg-dark-surface dark:text-slate-100 dark:hover:text-brand-400';

/** Search results, or a way out when nothing matches: simpler words and a person to ask. */
export const HelpResults: React.FC<HelpResultsProps> = ({ query, results, siteName, suggestions, contact, onSelect, onSuggest }) => (
    <section aria-labelledby="help-results" className="space-y-6">
        <h2 id="help-results" className="font-serif text-2xl text-slate-900 [overflow-wrap:anywhere] dark:text-white">
            {results.length ? `${results.length} ${results.length === 1 ? 'guia' : 'guias'} para «${query}»` : `Sem resultados para «${query}»`}
        </h2>
        {results.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.map(t => <TutorialCard key={t.id} tutorial={t} siteName={siteName} onSelect={onSelect} eyebrow={getCategory(t.category)?.title} />)}
            </div>
        )}
        {results.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-900/15 px-4 py-10 text-center dark:border-white/15 sm:px-6">
                <SearchX size={32} aria-hidden="true" className="text-slate-500 dark:text-slate-400" />
                <p className="max-w-md text-base text-slate-700 dark:text-slate-300">Experimente uma palavra mais simples:</p>
                <ul className="flex flex-wrap justify-center gap-2">
                    {suggestions.map(term => (
                        <li key={term}><button type="button" onClick={() => onSuggest(term)} className={CHIP}>{term}</button></li>
                    ))}
                </ul>
            </div>
        )}
        {results.length < 3 && contact && <HelpContactCard contact={contact} siteName={siteName} />}
    </section>
);
