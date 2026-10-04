import React from 'react';
import { ExternalLink, Plus, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';
import { ContextHelp } from '../help/ContextHelp';
import type { Tab } from '../types';

interface AdminPageHeaderProps {
    title: string;
    /** One line explaining what this section controls on the public site. */
    description?: string;
    /** Record count for list tabs. */
    count?: number;
    action?: { label: string; onClick: () => void };
    /** Secondary "Criar com IA" next to the primary action, on the tabs the AI studio supports. */
    aiAction?: { label: string; onClick: () => void };
    /** "Como funciona" with the guides of this tab; hidden when the tab has none. */
    help?: { tab: Tab; siteName: string; onOpenCenter: (tutorialId: string | null) => void };
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, description, count, action, aiAction, help }) => (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
            <h1 className="flex items-center gap-3 font-serif text-2xl text-white md:text-3xl">
                <span className="truncate">{title}</span>
                {count !== undefined && (
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-sans text-xs font-bold tabular-nums text-slate-400">
                        {count}
                    </span>
                )}
            </h1>
            {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {help && <ContextHelp tab={help.tab} siteName={help.siteName} onOpenCenter={help.onOpenCenter} />}
            <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:inline-flex"
            >
                <ExternalLink size={14} /> Ver site
            </a>
            {aiAction && (
                <Button variant="outline" onClick={aiAction.onClick} className="w-full dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200 dark:hover:border-brand-400 dark:hover:text-white md:w-auto">
                    <Sparkles size={16} /> {aiAction.label}
                </Button>
            )}
            {action && (
                <Button onClick={action.onClick} className="w-full shadow-lg md:w-auto">
                    <Plus size={18} /> {action.label}
                </Button>
            )}
        </div>
    </header>
);
