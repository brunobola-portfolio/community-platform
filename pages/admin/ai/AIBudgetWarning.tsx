import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatUsd } from '../../../convex/lib/aiCost';
import { cn } from '../../../utils/cn';
import { useAiMonth } from './useAiMonth';

interface AIBudgetWarningProps {
    className?: string;
}

/**
 * Amber note shown before generating once the month's AI spend passed the
 * budget. It informs and never blocks: a secretary with a deadline still gets
 * her poster.
 */
export const AIBudgetWarning: React.FC<AIBudgetWarningProps> = ({ className }) => {
    const month = useAiMonth();
    if (!month?.overBudget || month.budgetUsd === undefined) return null;
    return (
        <p role="status" className={cn('flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200', className)}>
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
                O gasto de IA deste mês ({formatUsd(month.costUsd)}) já passou o orçamento de {formatUsd(month.budgetUsd)}.
                Pode continuar a gerar; o orçamento ajusta-se em Assistente virtual › Utilização e custos.
            </span>
        </p>
    );
};
