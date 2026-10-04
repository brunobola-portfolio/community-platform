import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatUsd } from '../../../convex/lib/aiCost';

export interface RecentRequest {
    id: string;
    timestamp: number;
    who: string;
    feature: string;
    model: string;
    latencyMs: number;
    costUsd?: number;
    success: boolean;
    reason?: string;
}

interface UsageRecentListProps {
    rows: RecentRequest[];
}

const when = (ts: number) => new Date(ts).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const seconds = (ms: number) => `${(ms / 1000).toLocaleString('pt-PT', { maximumFractionDigits: ms < 10_000 ? 1 : 0 })} s`;
const shortModel = (model: string) => model.replace(/^(google|openai|models)\//, '');

const Status: React.FC<{ row: RecentRequest }> = ({ row }) => (row.success ? (
    <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 size={14} aria-hidden="true" /> Concluído</span>
) : (
    <span className="inline-flex items-center gap-1 text-red-300"><XCircle size={14} aria-hidden="true" /> {row.reason ?? 'Falhou'}</span>
));

/** The latest requests, read-only: who asked for what, on which model, how long it took and what it cost. */
export const UsageRecentList: React.FC<UsageRecentListProps> = ({ rows }) => (
    <div className="rounded-xl border border-white/5 bg-black/30">
        <h4 className="px-4 pt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Últimos pedidos</h4>
        {rows.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Ainda não há pedidos neste período.</p>
        ) : (
            <div className="overflow-x-auto p-2">
                <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs text-slate-500">
                        <tr>
                            <th scope="col" className="px-2 py-2 font-medium">Quando</th>
                            <th scope="col" className="px-2 py-2 font-medium">Quem</th>
                            <th scope="col" className="px-2 py-2 font-medium">Função</th>
                            <th scope="col" className="px-2 py-2 font-medium">Modelo</th>
                            <th scope="col" className="px-2 py-2 text-right font-medium">Duração</th>
                            <th scope="col" className="px-2 py-2 text-right font-medium">Custo</th>
                            <th scope="col" className="px-2 py-2 font-medium">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {rows.map(row => (
                            <tr key={row.id} className="text-slate-300">
                                <td className="whitespace-nowrap px-2 py-2 tabular-nums text-slate-400">{when(row.timestamp)}</td>
                                <td className="max-w-[180px] truncate px-2 py-2" title={row.who}>{row.who}</td>
                                <td className="whitespace-nowrap px-2 py-2 text-white">{row.feature}</td>
                                <td className="max-w-[200px] truncate px-2 py-2 font-mono text-xs" title={row.model}>{shortModel(row.model)}</td>
                                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">{seconds(row.latencyMs)}</td>
                                <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums text-white">{formatUsd(row.costUsd)}</td>
                                <td className="whitespace-nowrap px-2 py-2 text-xs"><Status row={row} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);
