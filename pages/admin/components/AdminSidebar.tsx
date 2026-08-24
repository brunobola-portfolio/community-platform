
import React from 'react';
import {
    LogOut, LayoutDashboard, Calendar, FileText, Users, Image as ImageIcon,
    Settings as SettingsIcon, Handshake, Bell, Layers, Award, ChevronRight,
    Shield, FileBox, PenTool, Bot, Inbox, Landmark, Wallet
} from 'lucide-react';
import { Button, cn } from '../../../components/ui/UIComponents';
import type { Tab } from '../types';

interface SidebarItemProps {
    id: Tab;
    icon: React.ElementType;
    label: string;
    activeTab: Tab;
    onSelect: (id: Tab) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ id, icon: Icon, label, activeTab, onSelect }) => (
    <button
        onClick={() => onSelect(id)}
        className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 mb-1 border",
            activeTab === id
                ? "bg-brand-600 text-white border-brand-500 shadow-md"
                : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
        )}
    >
        <Icon
            size={18}
            className={cn(
                "transition-colors shrink-0",
                activeTab === id ? "text-white" : "text-slate-500 group-hover:text-brand-400"
            )}
        />
        <span className="font-medium text-sm flex-1">{label}</span>
        {activeTab === id && <ChevronRight size={14} className="opacity-50" />}
    </button>
);

export interface AdminSidebarProps {
    activeTab: Tab;
    mobileMenuOpen: boolean;
    onTabSelect: (tab: Tab) => void;
    onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, mobileMenuOpen, onTabSelect, onLogout }) => (
    <aside className={cn(
        "fixed inset-y-0 left-0 z-[60] w-72 bg-dark-surface border-r border-white/5 flex flex-col transition-transform duration-300 md:translate-x-0 md:static",
        mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
    )}>
        <div className="p-6 hidden md:block">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(223,61,50,0.3)]">
                    <Shield size={24} />
                </div>
                <div>
                    <h1 className="font-serif font-bold text-lg text-white leading-none">Backoffice</h1>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Admin OS</span>
                </div>
            </div>
        </div>

        <nav aria-label="Menu de administração" className="flex-1 px-4 space-y-6 overflow-y-auto py-6 mt-16 md:mt-0 custom-scrollbar">
            <div>
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Visão Geral</h3>
                <div className="space-y-1">
                    <SidebarItem id="dashboard" icon={LayoutDashboard} label="Painel de Controlo" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="homepage" icon={PenTool} label="Homepage" activeTab={activeTab} onSelect={onTabSelect} />
                </div>
            </div>
            <div>
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Gestão de Conteúdo</h3>
                <div className="space-y-1">
                    <SidebarItem id="events" icon={Calendar} label="Eventos" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="news" icon={FileText} label="Notícias" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="members" icon={Users} label="Membros" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="sponsors" icon={Handshake} label="Parceiros" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="gallery" icon={ImageIcon} label="Galeria" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="historia" icon={Landmark} label="História" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="leads" icon={Inbox} label="Leads & Contactos" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="member-quotas" icon={Wallet} label="Sócios & Quotas" activeTab={activeTab} onSelect={onTabSelect} />
                </div>
            </div>
            <div>
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sistema</h3>
                <div className="space-y-1">
                    <SidebarItem id="documents" icon={FileBox} label="Documentos" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="notifications" icon={Bell} label="Notificações" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="categories" icon={Layers} label="Categorias" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="tiers" icon={Award} label="Níveis de Parceria" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="ai" icon={Bot} label="IA & Chatbot" activeTab={activeTab} onSelect={onTabSelect} />
                    <SidebarItem id="settings" icon={SettingsIcon} label="Definições" activeTab={activeTab} onSelect={onTabSelect} />
                </div>
            </div>
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:bg-red-900/10 hover:text-red-300 h-9" onClick={onLogout}>
                <LogOut size={16} className="mr-2" /> Terminar Sessão
            </Button>
        </div>
    </aside>
);
