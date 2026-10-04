import React from 'react';
import { Search, X } from 'lucide-react';

interface HelpSearchFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

export const HelpSearchField: React.FC<HelpSearchFieldProps> = ({ value, onChange, placeholder }) => (
    <div className="relative">
        <Search size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
        <input
            type="search"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape' && value) { e.preventDefault(); onChange(''); } }}
            placeholder={placeholder}
            aria-label="Pesquisar na ajuda"
            className="h-14 w-full rounded-2xl border border-slate-900/10 bg-white pl-12 pr-12 text-base text-slate-900 shadow-lg outline-none transition-colors placeholder:text-slate-500 focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
            <button
                type="button"
                onClick={() => onChange('')}
                aria-label="Limpar pesquisa"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
                <X size={18} />
            </button>
        )}
    </div>
);
