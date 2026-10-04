import React from 'react';
import { formatUsd } from '../../../convex/lib/aiCost';
import { cn } from '../../../utils/cn';

interface Breakdown { name: string; calls: number; costUsd: number; unpriced: number }

interface KpiCardProps {
    label: string;
    value: string;
    hint?: string;
    accent?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, accent = 'text-white' }) => (
    <div className="rounded-xl border border-white/5 bg-black/40 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
        <p className={cn('mt-1 text-2xl font-bold tabular-nums', accent)}>{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
);

/** A breakdown whose rows all predate cost tracking has no cost to show, which is not zero. */
const costOf = (b: Breakdown) => (b.unpriced === b.calls ? '—' : formatUsd(b.costUsd));

interface BreakdownListProps {
    title: string;
    entries: Breakdown[];
    /** Strips a noisy prefix (e.g. "google/") from long model ids. */
    shorten?: (name: string) => string;
}

/** Cost and calls per group, the most expensive first, with a share bar sized by cost (or calls when unpriced). */
export const BreakdownList: React.FC<BreakdownListProps> = ({ title, entries, shorten }) => {
    const byCost = entries.some(e => e.costUsd > 0);
    const max = Math.max(...entries.map(e => (byCost ? e.costUsd : e.calls)), 0);
    return (
        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h4>
            {entries.length === 0 ? (
                <p className="text-sm text-slate-500">Sem pedidos neste período.</p>
            ) : (
                <ul className="space-y-2.5">
                    {entries.slice(0, 8).map(e => {
                        const share = max > 0 ? (byCost ? e.costUsd : e.calls) / max : 0;
                        return (
                            <li key={e.name}>
                                <div className="flex items-baseline justify-between gap-3 text-sm">
                                    <span className="min-w-0 truncate text-slate-200" title={e.name}>{shorten ? shorten(e.name) : e.name}</span>
                                    <span className="shrink-0 tabular-nums text-slate-400">
                                        <span className="text-white">{costOf(e)}</span> · {e.calls} {e.calls === 1 ? 'pedido' : 'pedidos'}
                                    </span>
                                </div>
                                <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="mt-1 h-1 w-full" aria-hidden="true">
                                    <rect x={0} y={0} width={100} height={4} rx={2} className="fill-white/5" />
                                    <rect x={0} y={0} width={Math.max(share * 100, share > 0 ? 2 : 0)} height={4} rx={2} className="fill-brand-500" />
                                </svg>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
