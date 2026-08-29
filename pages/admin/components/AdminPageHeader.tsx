import React from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';

interface AdminPageHeaderProps {
    title: string;
    /** One line explaining what this section controls on the public site. */
    description?: string;
    /** Record count for list tabs. */
    count?: number;
    action?: { label: string; onClick: () => void };
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, description, count, action }) => (
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

        <div className="flex shrink-0 items-center gap-2">
            <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:inline-flex"
            >
                <ExternalLink size={14} /> Ver site
            </a>
            {action && (
                <Button onClick={action.onClick} className="w-full shadow-lg md:w-auto">
                    <Plus size={18} /> {action.label}
                </Button>
            )}
        </div>
    </header>
);
