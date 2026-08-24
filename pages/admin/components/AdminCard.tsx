
import React from 'react';

export interface AdminCardProps {
    image?: string;
    title: string;
    subtitle?: string;
    status?: React.ReactNode;
    actions: React.ReactNode;
}

export const AdminCard: React.FC<AdminCardProps> = ({ image, title, subtitle, status, actions }) => (
    <div className="bg-dark-surface border border-white/10 rounded-xl p-4 flex gap-4 items-center animate-fade-in-up shadow-sm relative overflow-hidden">
        {image && (
            <div className="w-16 h-16 rounded-lg bg-black/40 shrink-0 overflow-hidden border border-white/5 shadow-inner">
                <img src={image} className="w-full h-full object-cover" alt="" />
            </div>
        )}
        <div className="flex-1 min-w-0 relative z-10">
            <h4 className="text-white font-medium truncate text-sm">{title}</h4>
            {subtitle && <div className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</div>}
            {status && <div className="mt-1.5">{status}</div>}
        </div>
        <div className="flex flex-col gap-2 shrink-0 relative z-10">{actions}</div>
    </div>
);
