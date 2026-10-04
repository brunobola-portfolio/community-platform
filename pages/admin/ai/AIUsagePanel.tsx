import React, { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { Coins, Loader2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { formatUsd } from '../../../convex/lib/aiCost';
import { cn } from '../../../utils/cn';
import { BreakdownList, KpiCard } from './UsageBreakdowns';
import { UsageBudget } from './UsageBudget';
import { UsageDailyChart } from './UsageDailyChart';
import { UsageRecentList } from './UsageRecentList';
import { useAiMonth } from './useAiMonth';
import { PERIOD_LABEL, periodStart, type UsagePeriod } from './aiUsageCopy';

interface AIUsagePanelProps {
    budgetUsd: number | undefined;
    onBudgetChange: (value: number) => void;
}

const PERIODS: UsagePeriod[] = ['7d', '30d', 'month'];
const shortModel = (name: string) => name.replace(/^(google|openai|models)\//, '');
const seconds = (ms: number) => `${(ms / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} s`;

interface PeriodPickerProps {
    value: UsagePeriod;
    onChange: (value: UsagePeriod) => void;
}

const PeriodPicker: React.FC<PeriodPickerProps> = ({ value, onChange }) => (
    <div role="radiogroup" aria-label="Período" className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
        {PERIODS.map(p => (
            <button
                key={p}
                type="button"
                role="radio"
                aria-checked={value === p}
                onClick={() => onChange(p)}
                className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    value === p ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white',
                )}
            >
                {PERIOD_LABEL[p]}
            </button>
        ))}
    </div>
);

/**
 * "Utilização e custos": what the AI cost, who used it, for what and how
 * reliably. Costs come from the log rows (OpenRouter's reported price or an
 * estimate from Gemini's token counts); rows logged before costs were tracked
 * show a dash and are counted apart, never as zero.
 */
export const AIUsagePanel: React.FC<AIUsagePanelProps> = ({ budgetUsd, onBudgetChange }) => {
    const [period, setPeriod] = useState<UsagePeriod>('30d');
    const args = useMemo(() => ({ since: periodStart(period), tzOffsetMinutes: new Date().getTimezoneOffset() }), [period]);
    const usage = useQuery(api.aiLogs.usage, args);
    const month = useAiMonth();

    return (
        <section aria-labelledby="ai-usage-title" className="rounded-2xl border border-white/10 bg-dark-surface p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 id="ai-usage-title" className="flex items-center gap-2 font-serif text-xl text-white">
                        <Coins className="text-amber-300" aria-hidden="true" /> Utilização e custos
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">Quanto custou a IA, quem a usou e para quê. Os valores estão em dólares, como os cobram os fornecedores.</p>
                </div>
                <PeriodPicker value={period} onChange={setPeriod} />
            </div>

            {usage === undefined ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> A carregar…</div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <KpiCard label="Custo total" value={usage.calls > 0 && usage.unpricedCalls === usage.calls ? '—' : formatUsd(usage.totalCostUsd)} accent="text-amber-200" hint={usage.unpricedCalls ? `${usage.unpricedCalls} sem custo registado` : undefined} />
                        <KpiCard label="Pedidos" value={usage.calls.toLocaleString('pt-PT')} />
                        <KpiCard label="Taxa de sucesso" value={`${usage.successRate}%`} accent={usage.successRate < 90 ? 'text-amber-300' : 'text-emerald-400'} />
                        <KpiCard label="Tempo médio" value={seconds(usage.avgLatencyMs)} />
                    </div>
                    {(usage.unpricedCalls > 0 || usage.truncated) && (
                        <p className="text-xs text-slate-500">
                            {usage.unpricedCalls > 0 && 'Pedidos anteriores ao registo de custos aparecem com “—” e não entram no total. '}
                            {usage.truncated && 'O período tem muitos pedidos: os números contam os 5000 mais recentes.'}
                        </p>
                    )}
                    <UsageBudget budgetUsd={budgetUsd} spentUsd={month?.costUsd} onChange={onBudgetChange} />
                    <UsageDailyChart daily={usage.daily} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <BreakdownList title="Por função" entries={usage.byFeature} />
                        <BreakdownList title="Por modelo" entries={usage.byModel} shorten={shortModel} />
                    </div>
                    <UsageRecentList rows={usage.recent} />
                </div>
            )}
        </section>
    );
};
