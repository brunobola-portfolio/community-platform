import React from 'react';
import { formatUsd } from '../../../convex/lib/aiCost';

interface DailyPoint { day: string; calls: number; costUsd: number; unpriced: number }

interface UsageDailyChartProps {
    daily: DailyPoint[];
}

const HEIGHT = 120;
const BAR_GAP = 0.25;

/** A day whose requests all predate cost tracking has no cost, which is not zero. */
const dayCost = (d: DailyPoint) => (d.calls > 0 && d.unpriced === d.calls ? '—' : formatUsd(d.costUsd));

const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${day}T12:00:00`).toLocaleDateString('pt-PT', opts);

/**
 * Daily cost as bars (calls when nothing was priced yet). SVG attributes size
 * the bars, so no inline style is needed; the numbers are also in a visually
 * hidden table for screen readers, and in each bar's tooltip.
 */
export const UsageDailyChart: React.FC<UsageDailyChartProps> = ({ daily }) => {
    const byCost = daily.some(d => d.costUsd > 0);
    const value = (d: DailyPoint) => (byCost ? d.costUsd : d.calls);
    const max = Math.max(...daily.map(value), 0);
    const width = Math.max(daily.length, 1);
    const first = daily[0]?.day;
    const last = daily[daily.length - 1]?.day;

    return (
        <figure className="rounded-xl border border-white/5 bg-black/30 p-4">
            <figcaption className="mb-3 flex items-baseline justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-400">{byCost ? 'Custo por dia' : 'Pedidos por dia'}</span>
                <span className="text-slate-500">máximo {byCost ? formatUsd(max) : `${max} pedidos`}</span>
            </figcaption>
            <svg viewBox={`0 0 ${width} ${HEIGHT}`} preserveAspectRatio="none" className="h-32 w-full" aria-hidden="true">
                <line x1={0} x2={width} y1={HEIGHT - 0.5} y2={HEIGHT - 0.5} className="stroke-white/10" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                {daily.map((d, i) => {
                    const h = max > 0 ? Math.max((value(d) / max) * (HEIGHT - 4), value(d) > 0 ? 2 : 0) : 0;
                    return (
                        <rect key={d.day} x={i + BAR_GAP / 2} width={1 - BAR_GAP} y={HEIGHT - h} height={h} rx={0.15} className="fill-brand-500/80 hover:fill-brand-400">
                            <title>{`${dayLabel(d.day, { day: 'numeric', month: 'short' })}: ${dayCost(d)} · ${d.calls} pedidos`}</title>
                        </rect>
                    );
                })}
            </svg>
            {first && last && (
                <div className="mt-2 flex justify-between text-[11px] text-slate-500" aria-hidden="true">
                    <span>{dayLabel(first, { day: 'numeric', month: 'short' })}</span>
                    <span>{dayLabel(last, { day: 'numeric', month: 'short' })}</span>
                </div>
            )}
            <table className="sr-only">
                <caption>Custo e pedidos por dia</caption>
                <thead><tr><th scope="col">Dia</th><th scope="col">Custo</th><th scope="col">Pedidos</th></tr></thead>
                <tbody>
                    {daily.map(d => (
                        <tr key={d.day}><td>{dayLabel(d.day, { day: 'numeric', month: 'long' })}</td><td>{dayCost(d)}</td><td>{d.calls}</td></tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
};
