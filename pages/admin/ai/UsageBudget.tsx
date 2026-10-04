import React from 'react';
import { formatUsd } from '../../../convex/lib/aiCost';
import { cn } from '../../../utils/cn';
import { Field } from '../components/Field';
import { STD_INPUT_CLASS } from '../constants';
import { budgetShare } from './aiUsageCopy';

interface UsageBudgetProps {
    /** The budget being edited in the form (saved with the tab's Guardar). */
    budgetUsd: number | undefined;
    /** This month's spend; undefined while loading. */
    spentUsd: number | undefined;
    onChange: (value: number) => void;
}

/**
 * Optional monthly budget with this month's progress. Passing it only warns
 * the studio and the MediaStudio; generation is never blocked.
 */
export const UsageBudget: React.FC<UsageBudgetProps> = ({ budgetUsd, spentUsd, onChange }) => {
    const hasBudget = Boolean(budgetUsd && budgetUsd > 0);
    const spent = spentUsd ?? 0;
    const share = budgetShare(spent, budgetUsd);
    const over = hasBudget && spent > (budgetUsd ?? 0);

    return (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/5 bg-black/30 p-4 md:grid-cols-[220px_1fr] md:items-end">
            <Field label="Orçamento mensal (USD)" hint="Vazio: sem orçamento.">
                <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="decimal"
                    value={hasBudget ? String(budgetUsd) : ''}
                    // 0 is how the form says "no budget": an empty field cannot be sent to clear it
                    onChange={e => onChange(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0))}
                    className={STD_INPUT_CLASS}
                    placeholder="Ex.: 10"
                />
            </Field>
            <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-300">Gasto este mês</span>
                    <span className="tabular-nums text-white">
                        {spentUsd === undefined ? '…' : formatUsd(spent)}
                        {hasBudget && <span className="text-slate-400"> de {formatUsd(budgetUsd)}</span>}
                    </span>
                </div>
                {hasBudget ? (
                    <>
                        <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-2 w-full" role="img" aria-label={`${share}% do orçamento mensal usado`}>
                            <rect x={0} y={0} width={100} height={6} rx={3} className="fill-white/10" />
                            <rect x={0} y={0} width={share} height={6} rx={3} className={cn(over ? 'fill-amber-400' : share >= 80 ? 'fill-amber-300/80' : 'fill-emerald-400')} />
                        </svg>
                        <p className={cn('mt-1.5 text-xs', over ? 'text-amber-300' : 'text-slate-400')}>
                            {over
                                ? 'O orçamento foi ultrapassado: o estúdio e o “Gerar com IA” avisam antes de gerar, sem bloquear.'
                                : `${share}% usado. Ao passar o orçamento, o estúdio e o “Gerar com IA” mostram um aviso.`}
                        </p>
                    </>
                ) : (
                    <p className="text-xs text-slate-400">Defina um valor para acompanhar o gasto do mês e receber um aviso ao ultrapassá-lo.</p>
                )}
            </div>
        </div>
    );
};
