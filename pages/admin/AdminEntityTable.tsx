
import React from 'react';

/**
 * Reusable desktop table for entity listings.
 * Renders headers and rows with a consistent admin style.
 */

export interface AdminEntityTableProps {
    headers: string[];
    children: React.ReactNode;
}

export const AdminEntityTable: React.FC<AdminEntityTableProps> = ({ headers, children }) => (
    <div className="bg-dark-surface border border-white/10 rounded-xl overflow-hidden shadow-sm animate-fade-in-up hidden md:block">
        <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-white/5 text-slate-400">
                <tr>
                    {headers.map((h, i) => <th key={i} className="p-4">{h}</th>)}
                    <th className="p-4 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {children}
            </tbody>
        </table>
    </div>
);
