import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../components/ui/UIComponents';

type AdminSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Styled replacement for native selects in the backoffice: hides the
 * platform arrow (appearance-none) and overlays a Lucide chevron so the
 * control matches the rest of the dark admin surfaces.
 */
export const AdminSelect: React.FC<AdminSelectProps> = ({ className, children, ...props }) => (
    <div className="relative">
        <select
            {...props}
            className={cn(
                'w-full min-w-0 appearance-none bg-slate-950/50 border border-slate-800 rounded-lg p-3 pr-10 text-white',
                'focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 outline-none transition-all cursor-pointer',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
        >
            {children}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
    </div>
);
