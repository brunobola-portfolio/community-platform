
import React from 'react';
import {
    LogOut, LayoutDashboard, Calendar, FileText, Users, Image as ImageIcon,
    Settings as SettingsIcon, Handshake, Bell, Layers, Award, ChevronRight,
    Shield, FileBox, PenTool, Bot, Inbox, Landmark, Wallet, X, ClipboardCheck, KeyRound, LifeBuoy
} from 'lucide-react';
import { ChangePasswordModal } from '../../../components/ChangePasswordModal';
import { Button, cn } from '../../../components/ui/UIComponents';
import type { Tab } from '../types';

interface SidebarItemProps {
    id: Tab;
    icon: React.ElementType;
    label: string;
    activeTab: Tab;
    onSelect: (id: Tab) => void;
    /** Items waiting for action, shown as a count. */
    badge?: number;
}

/** Own state so the stateless sidebar can open the password dialog. */
const AccountButton: React.FC = () => {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:bg-white/5 hover:text-white h-9" onClick={() => setOpen(true)}>
                <KeyRound size={16} className="mr-2" /> Alterar palavra-passe
            </Button>
            <ChangePasswordModal isOpen={open} onClose={() => setOpen(false)} />
        </>
    );
};

const SidebarItem: React.FC<SidebarItemProps> = ({ id, icon: Icon, label, activeTab, onSelect, badge }) => (
    <button
        onClick={() => onSelect(id)}
        aria-current={activeTab === id ? 'page' : undefined}
        className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 mb-1 border",
            activeTab === id
                ? "bg-brand-700 text-white border-brand-500 shadow-md"
                : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
        )}
    >
        <Icon
            size={18}
            className={cn(
                "transition-colors shrink-0",
                activeTab === id ? "text-white" : "text-slate-400 group-hover:text-brand-400"
            )}
        />
        <span className="font-medium text-sm flex-1">{label}</span>
        {badge ? <><span aria-hidden="true" className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-950">{badge}</span><span className="sr-only">, {badge} por tratar</span></> : null}
        {activeTab === id && <ChevronRight size={14} className="opacity-50" />}
    </button>
);

export interface AdminSidebarProps {
    activeTab: Tab;
    mobileMenuOpen: boolean;
    onTabSelect: (tab: Tab) => void;
    onClose: () => void;
    onLogout: () => void;
    pendingRegistrations?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, mobileMenuOpen, onTabSelect, onClose, onLogout, pendingRegistrations }) => (
    <aside className={cn(
        "fixed inset-y-0 left-0 z-[60] w-72 bg-dark-surface border-r border-white/5 flex flex-col transition-transform duration-300 md:translate-x-0 md:static",
        mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
    )}>
        <div className="flex items-center justify-between p-6 pb-4 md:pb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-700 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgb(var(--brand-600)/0.3)]">
                    <Shield size={24} />
                </div>
                <div>
                    <p className="font-serif font-bold text-lg text-white leading-none">Gestão do site</p>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Backoffice</span>
                </div>
            </div>
            <button
                onClick={onClose}
                aria-label="Fechar menu"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
            >
                <X size={20} />
            </button>
        </div>

        <nav aria-label="Menu de administração" className="flex-1 px-4 space-y-6 overflow-y-auto py-4 custom-scrollbar">
            <div>
                <h2 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Geral</h2>
                <div className="space-y-1">
                    <SidebarItem id="dashboard" icon={LayoutDashboard} label="Início" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="homepage" icon={PenTool} label="Página inicial" activeTab={activeTab} onSelect={onTabSelect} />
                </div>
            </div>
            <div>
                <h2 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Conteúdos</h2>
                <div className="space-y-1">
                    <SidebarItem id="events" icon={Calendar} label="Eventos" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="registrations" icon={ClipboardCheck} label="Inscrições" activeTab={activeTab} onSelect={onTabSelect} badge={pendingRegistrations} />
                    <SidebarItem id="news" icon={FileText} label="Notícias" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="members" icon={Users} label="Membros" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="sponsors" icon={Handshake} label="Parceiros" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="gallery" icon={ImageIcon} label="Galeria" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="historia" icon={Landmark} label="História" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="leads" icon={Inbox} label="Mensagens recebidas" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="member-quotas" icon={Wallet} label="Sócios & Quotas" activeTab={activeTab} onSelect={onTabSelect} />
                </div>
            </div>
            <div>
                <h2 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sistema</h2>
                <div className="space-y-1">
                    <SidebarItem id="documents" icon={FileBox} label="Documentos" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="notifications" icon={Bell} label="Avisos aos sócios" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="categories" icon={Layers} label="Categorias" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="tiers" icon={Award} label="Níveis de Parceria" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="access" icon={KeyRound} label="Acessos" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="ai" icon={Bot} label="Assistente virtual" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="settings" icon={SettingsIcon} label="Definições" activeTab={activeTab} onSelect={onTabSelect} />
                </div>
            </div>
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20 space-y-1">
            <SidebarItem id="help" icon={LifeBuoy} label="Ajuda" activeTab={activeTab} onSelect={onTabSelect} />
            <AccountButton />
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:bg-red-900/10 hover:text-red-300 h-9" onClick={onLogout}>
                <LogOut size={16} className="mr-2" /> Terminar Sessão
            </Button>
        </div>
    </aside>
);
