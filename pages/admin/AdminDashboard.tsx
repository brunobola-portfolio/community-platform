
import React from 'react';
import {
    Check, TrendingUp, Coins, Activity, Server,
    Zap, CheckCircle2, Eye, History, Plus
} from 'lucide-react';
import { Button } from '../../components/ui/UIComponents';
import type { AdminDashboardProps } from './types';

/**
 * Dashboard tab for the admin panel.
 * Displays real-time stats, pending approvals, and system logs.
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    membersCount,
    dashboardStats,
    activityLogs,
    aiStats,
    onViewRegistration,
    onNewPost,
    onNewEvent,
}) => {
    const latencyDisplay = aiStats?.avgLatency != null
        ? `Assistente IA: ${(aiStats.avgLatency / 1000).toFixed(1)}s de resposta média`
        : 'Backend Convex em tempo real';

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Sócios Totais"
                    value={membersCount}
                    icon={<Check className="text-brand-500/50" size={20} />}
                    gradient="from-dark-surface to-brand-900/10"
                    footer={<span className="text-xs text-slate-500">Total registados</span>}
                />
                <StatCard
                    label="Inscrições Confirmadas"
                    value={dashboardStats.confirmedRegistrations}
                    icon={<Coins className="text-emerald-500/50" size={20} />}
                    gradient="from-dark-surface to-emerald-900/10"
                    footer={<span className="text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12} /> Total confirmadas</span>}
                />
                <StatCard
                    label="Pendentes"
                    value={dashboardStats.pendingRegistrations.length}
                    icon={<Activity className="text-amber-500/50" size={20} />}
                    gradient="from-dark-surface to-amber-900/10"
                    footer={<span className="text-xs text-slate-500">A aguardar validação</span>}
                />
                <StatCard
                    label="Sistema"
                    value={null}
                    icon={<Server className="text-blue-400/50" size={20} />}
                    gradient="from-dark-surface to-blue-900/10"
                    footer={<span className="text-xs text-slate-500">{latencyDisplay}</span>}
                    customValue={
                        <h3 className="text-xl font-bold text-white mt-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Operacional
                        </h3>
                    }
                />
            </div>

            {/* Two-column grid: Approvals + Activity Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ApprovalsPanel
                    pendingRegistrations={dashboardStats.pendingRegistrations}
                    onViewRegistration={onViewRegistration}
                    onNewPost={onNewPost}
                    onNewEvent={onNewEvent}
                />
                <ActivityLogPanel activityLogs={activityLogs} />
            </div>
        </div>
    );
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: number | null;
    icon: React.ReactNode;
    gradient: string;
    footer: React.ReactNode;
    customValue?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient, footer, customValue }) => (
    <div className={`bg-gradient-to-br ${gradient} p-5 rounded-2xl border border-white/10 relative overflow-hidden group shadow-lg`}>
        <div className="flex justify-between items-start">
            <p className="text-slate-400 text-xs uppercase font-bold">{label}</p>
            {icon}
        </div>
        {customValue ?? <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>}
        <div className="mt-2">{footer}</div>
    </div>
);

interface ApprovalsPanelProps {
    pendingRegistrations: AdminDashboardProps['dashboardStats']['pendingRegistrations'];
    onViewRegistration: AdminDashboardProps['onViewRegistration'];
    onNewPost: () => void;
    onNewEvent: () => void;
}

const ApprovalsPanel: React.FC<ApprovalsPanelProps> = ({
    pendingRegistrations,
    onViewRegistration,
    onNewPost,
    onNewEvent,
}) => (
    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 shadow-lg h-96 flex flex-col">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-amber-400" /> Ações Rápidas & Aprovações
        </h3>
        <div className="flex-1 flex flex-col">
            {pendingRegistrations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02] mb-4">
                    <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2 opacity-50" />
                    <p className="text-slate-500 text-sm">Tudo em dia! Sem pendentes.</p>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 mb-4 flex-1">
                    {pendingRegistrations.map(reg => (
                        <button
                            key={reg.id}
                            type="button"
                            className="w-full flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 cursor-pointer hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            onClick={() => onViewRegistration(reg)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onViewRegistration(reg); }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-900/30 flex items-center justify-center text-brand-400 font-bold">
                                    {(reg.name ?? '?').charAt(0)}
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-medium text-sm">{reg.name ?? 'Participante'}</div>
                                    <div className="text-xs text-slate-500">Inscrição Pendente</div>
                                </div>
                            </div>
                            <div className="text-xs text-brand-400 flex items-center gap-1">Ver <Eye size={12} /></div>
                        </button>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-auto">
                <Button variant="outline" className="gap-2 justify-center" onClick={onNewPost}>
                    <Plus size={14} /> Nova Notícia
                </Button>
                <Button className="gap-2 bg-brand-600 hover:bg-brand-500 text-white justify-center" onClick={onNewEvent}>
                    <Plus size={14} /> Novo Evento
                </Button>
            </div>
        </div>
    </div>
);

interface ActivityLogPanelProps {
    activityLogs: AdminDashboardProps['activityLogs'];
}

const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ activityLogs }) => (
    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 shadow-lg h-96 flex flex-col">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <History size={18} className="text-slate-400" /> Logs do Sistema
        </h3>
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {activityLogs.slice(0, 10).map((log, i) => (
                <div key={log.id} className="flex gap-3 text-sm group">
                    <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-brand-500' : 'bg-slate-600 group-hover:bg-brand-400 transition-colors'}`} />
                        {i !== 9 && <div className="w-px h-full bg-white/5 my-1" />}
                    </div>
                    <div className="pb-2">
                        <p className="text-slate-300 leading-snug text-xs md:text-sm">{log.description}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">
                                {new Date(log.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-brand-400 bg-brand-900/10 px-1.5 rounded uppercase tracking-wider">
                                {log.action}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
