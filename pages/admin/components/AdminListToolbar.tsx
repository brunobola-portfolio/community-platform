import React, { useEffect, useRef } from 'react';
import { Search, X, ArrowUpDown, SearchX } from 'lucide-react';
import { cn } from '../../../components/ui/UIComponents';
import type { AdminListState } from '../../../hooks/useAdminList';

interface AdminListToolbarProps<T> {
    list: AdminListState<T>;
    placeholder: string;
    /** Singular/plural noun for the result count, e.g. ['evento', 'eventos']. */
    noun: [string, string];
}

/**
 * Search box (press "/" to focus), filter chips with live counts, sort select
 * and a result counter. Shared by every list tab so the backoffice behaves
 * the same everywhere.
 */
export function AdminListToolbar<T>({ list, placeholder, noun }: AdminListToolbarProps<T>) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
            if (e.key === '/' && !typing) { e.preventDefault(); inputRef.current?.focus(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const shown = list.visible.length;
    const label = shown === 1 ? noun[0] : noun[1];

    return (
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-3 md:p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        ref={inputRef}
                        value={list.query}
                        onChange={e => list.setQuery(e.target.value)}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/30"
                    />
                    {list.query ? (
                        <button type="button" onClick={() => list.setQuery('')} aria-label="Limpar pesquisa" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><X size={14} /></button>
                    ) : (
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-block text-[10px] font-mono text-slate-600 border border-white/10 rounded px-1.5">/</kbd>
                    )}
                </div>
                {list.sorts.length > 0 && (
                    <label className="relative md:w-56">
                        <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <select
                            value={list.sortKey}
                            onChange={e => list.setSortKey(e.target.value)}
                            aria-label="Ordenar por"
                            className="w-full appearance-none bg-black/30 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/30"
                        >
                            {list.sorts.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                    </label>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {list.filters.map(f => {
                    const active = f.key === list.filterKey;
                    return (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => list.setFilterKey(f.key)}
                            aria-pressed={active}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                                active ? 'bg-brand-500/15 border-brand-500/50 text-white' : 'bg-black/20 border-white/10 text-slate-400 hover:text-white hover:border-white/25'
                            )}
                        >
                            {f.label}
                            <span className={cn('font-mono text-[10px]', active ? 'text-brand-300' : 'text-slate-500')}>{list.counts[f.key] ?? 0}</span>
                        </button>
                    );
                })}
                <span className="ml-auto text-xs text-slate-500 font-variant-numeric tabular-nums">
                    {shown === list.total ? `${shown} ${label}` : `${shown} de ${list.total} ${noun[1]}`}
                </span>
            </div>
        </div>
    );
}

export const AdminListEmpty: React.FC<{ query: string; noun: string }> = ({ query, noun }) => (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-slate-500">
        <SearchX className="mx-auto mb-3" size={28} />
        {query ? <>Nenhum {noun} corresponde a <span className="text-slate-300">"{query}"</span>.</> : <>Ainda não há {noun}s neste filtro.</>}
    </div>
);
