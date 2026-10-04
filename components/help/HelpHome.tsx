import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TutorialCard } from './TutorialCard';
import { HELP_ICONS } from './helpIcons';
import { fillTokens } from '../../content/help';
import type { HelpCategory, HelpTutorial } from '../../content/help';

interface HelpHomeProps {
    tutorials: HelpTutorial[];
    categories: HelpCategory[];
    siteName: string;
    onSelect: (id: string) => void;
}

interface CategoryCardProps {
    category: HelpCategory;
    tutorials: HelpTutorial[];
    siteName: string;
    onSelect: (id: string) => void;
}

const SECTION_TITLE = 'font-serif text-2xl text-slate-900 dark:text-white';

const CategoryCard: React.FC<CategoryCardProps> = ({ category, tutorials, siteName, onSelect }) => {
    const Icon = HELP_ICONS[category.icon];
    return (
        <div className="flex flex-col rounded-3xl border border-slate-900/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-dark-surface dark:shadow-none">
            <div className="mb-4 flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-400">
                    <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h3 id={`help-cat-${category.id}`} className="font-serif text-xl text-slate-900 dark:text-white">{category.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{category.description}</p>
                </div>
            </div>
            <ul className="mt-auto divide-y divide-slate-900/5 border-t border-slate-900/5 dark:divide-white/5 dark:border-white/5">
                {tutorials.map(t => (
                    <li key={t.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(t.id)}
                            className="group flex w-full items-center gap-3 rounded-lg py-3 text-left text-sm text-slate-700 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:text-brand-400"
                        >
                            <span className="flex-1">{fillTokens(t.title, { siteName })}</span>
                            <span className="shrink-0 text-xs tabular-nums text-slate-600 dark:text-slate-400">{t.minutes} min</span>
                            <ChevronRight size={15} aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/** Landing view: the featured guides, then every category with its guides listed inline. */
export const HelpHome: React.FC<HelpHomeProps> = ({ tutorials, categories, siteName, onSelect }) => {
    const featured = tutorials.filter(t => t.featured);
    return (
        <div className="space-y-12">
            {featured.length > 0 && (
                <section aria-labelledby="help-start" className="space-y-4">
                    <h2 id="help-start" className={SECTION_TITLE}>Comece por aqui</h2>
                    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 custom-scrollbar md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
                        {featured.map(t => (
                            <TutorialCard key={t.id} tutorial={t} siteName={siteName} onSelect={onSelect} className="w-72 shrink-0 snap-start md:w-auto" />
                        ))}
                    </div>
                </section>
            )}
            <section aria-labelledby="help-topics" className="space-y-4">
                <h2 id="help-topics" className={SECTION_TITLE}>Todos os temas</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {categories.map(category => {
                        const items = tutorials.filter(t => t.category === category.id);
                        return items.length ? <CategoryCard key={category.id} category={category} tutorials={items} siteName={siteName} onSelect={onSelect} /> : null;
                    })}
                </div>
            </section>
        </div>
    );
};
