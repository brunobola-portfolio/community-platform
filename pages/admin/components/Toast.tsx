import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../../components/ui/UIComponents';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const STYLES: Record<ToastType, string> = {
    success: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100',
    error: 'border-red-500/40 bg-red-950/90 text-red-100',
    info: 'border-white/15 bg-dark-surface/95 text-slate-100',
};

const ICONS: Record<ToastType, React.ElementType> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
};

/**
 * Single-slot toast for backoffice feedback. Errors stay longer than
 * confirmations because they usually carry something to read and act on.
 */
export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const Icon = ICONS[type];
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; });

    useEffect(() => {
        const timer = setTimeout(() => onCloseRef.current(), type === 'error' ? 8000 : 4000);
        return () => clearTimeout(timer);
    }, [message, type]);

    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            aria-live={type === 'error' ? 'assertive' : 'polite'}
            className={cn(
                'fixed bottom-6 right-6 z-[200] flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md animate-fade-in-up',
                STYLES[type],
            )}
        >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="min-w-0 flex-1 text-sm leading-relaxed">{message}</p>
            <button
                onClick={onClose}
                aria-label="Fechar aviso"
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
                <X size={15} />
            </button>
        </div>
    );
};
