import React from 'react';
import { cn } from '../../../components/ui/UIComponents';

const CURRENT_YEAR = new Date().getFullYear();

/** Quota year with its up-to-date/late reading, as the member sees it. */
export const QuotaPill: React.FC<{ year: string }> = ({ year }) => {
    if (!year) return <span className="text-xs text-slate-500">—</span>;
    const isUpToDate = Number(year) >= CURRENT_YEAR;
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                isUpToDate
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300',
            )}
        >
            {year} · {isUpToDate ? 'Em dia' : 'Atrasada'}
        </span>
    );
};
