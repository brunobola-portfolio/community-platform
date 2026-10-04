import React from 'react';
import { Sparkles } from 'lucide-react';
import { formatUsd } from '../../../convex/lib/aiCost';
import { cn } from '../../../utils/cn';
import { budgetShare } from './aiUsageCopy';
import { useAiMonth } from './useAiMonth';

/** Dashboard tile: this month's AI spend and calls, with the budget when one is set. */
export const AIMonthTile: React.FC = () => {
    const month = useAiMonth();
    const share = month ? budgetShare(month.costUsd, month.budgetUsd) : 0;
    const summary = month ? `${formatUsd(month.costUsd)} · ${month.calls} ${month.calls === 1 ? 'pedido' : 'pedidos'}` : '…';

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-dark-surface to-amber-900/10 p-5 shadow-lg">
            <div className="flex items-start justify-between">
                <p className="text-xs font-bold uppercase text-slate-400">IA este mês</p>
                <Sparkles className="text-amber-400/50" size={20} aria-hidden="true" />
            </div>
            <h3 className="mt-2 text-2xl font-bold tabular-nums text-white">{summary}</h3>
            <div className="mt-2 text-xs">
                {month?.budgetUsd ? (
                    <span className={cn(month.overBudget ? 'text-amber-300' : 'text-slate-400')}>
                        {month.overBudget ? 'Orçamento ultrapassado' : `${share}% do orçamento`} de {formatUsd(month.budgetUsd)}
                    </span>
                ) : (
                    <span className="text-slate-400">Detalhe em Assistente virtual</span>
                )}
            </div>
        </div>
    );
};
