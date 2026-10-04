import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TutorialCard } from './TutorialCard';
import { HELP_ICONS } from './helpIcons';
import { fillTokens } from '../../content/help';
import type { HelpCategory, HelpTutorial } from '../../content/help';

interface HelpHomeProps {
    tutorials: HelpTutorial[];
    featured: HelpTutorial[];
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
const guidesLabel = (n: number) => `${n} ${n === 1 ? 'guia' : 'guias'}`;
const cardId = (id: string) => `help-cat-${id}`;

const CategoryCard: React.FC<CategoryCardProps> = ({ category, tutorials, siteName, onSelect }) => {
    const Icon = HELP_ICONS[category.icon];
    return (
        <div id={cardId(category.id)} tabIndex={-1} className="flex scroll-mt-28 flex-col rounded-3xl border border-slate-900/10 bg-white p-5 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-dark-surface dark:shadow-none sm:p-6">
            <div className="mb-3 flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-400">
                    <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h3 className="font-serif text-xl text-slate-900 dark:text-white">{category.title}</h3>
                    <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">{guidesLabel(tutorials.length)}</p>
                </div>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{category.description}</p>
            <ul className="mt-auto divide-y divide-slate-900/5 border-t border-slate-900/5 dark:divide-white/5 dark:border-white/5">
                {tutorials.map(t => (
                    <li key={t.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(t.id)}
                            className="group flex min-h-12 w-full items-center gap-3 rounded-lg py-2.5 text-left text-[15px] text-slate-800 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-200 dark:hover:text-brand-400"
                        >
                            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{fillTokens(t.title, { siteName })}</span>
                            <span className="shrink-0 text-xs tabular-nums text-slate-600 dark:text-slate-400">{t.minutes} min</span>
                            <ChevronRight size={16} aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

/** Moves to a topic card; focus follows so keyboard and screen reader users land there too. */
const jumpTo = (id: string) => {
    const card = document.getElementById(cardId(id));
    card?.scrollIntoView({ block: 'start' });
    card?.focus({ preventScroll: true });
};

/** Landing view: the featured guides, a topic index with counts, then every topic with its guides. */
export const HelpHome: React.FC<HelpHomeProps> = ({ tutorials, featured, categories, siteName, onSelect }) => {
    const filled = categories
        .map(category => ({ category, items: tutorials.filter(t => t.category === category.id) }))
        .filter(group => group.items.length > 0);

    return (
        <div className="space-y-12">
            {featured.length > 0 && (
                <section aria-labelledby="help-start" className="space-y-4">
                    <h2 id="help-start" className={SECTION_TITLE}>Comece por aqui</h2>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {featured.map(t => <TutorialCard key={t.id} tutorial={t} siteName={siteName} onSelect={onSelect} />)}
                    </div>
                </section>
            )}
            <section aria-labelledby="help-topics" className="space-y-5">
                <h2 id="help-topics" className={SECTION_TITLE}>Todos os temas</h2>
                <nav aria-label="Ir para um tema">
                    <ul className="flex flex-wrap gap-2">
                        {filled.map(({ category, items }) => (
                            <li key={category.id}>
                                <button
                                    type="button"
                                    onClick={() => jumpTo(category.id)}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors hover:border-brand-500/50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-dark-surface dark:text-slate-100 dark:hover:text-brand-400"
                                >
                                    {category.title}
                                    <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-xs tabular-nums text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                        <span className="sr-only">, </span>{guidesLabel(items.length)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filled.map(({ category, items }) => (
                        <CategoryCard key={category.id} category={category} tutorials={items} siteName={siteName} onSelect={onSelect} />
                    ))}
                </div>
            </section>
        </div>
    );
};
