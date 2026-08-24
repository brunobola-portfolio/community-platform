import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />,
  error: <AlertCircle size={20} className="text-red-600 dark:text-red-400" />,
  warning: <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />,
  info: <Info size={20} className="text-brand-600 dark:text-brand-400" />,
};

const borders: Record<ToastType, string> = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  warning: 'border-amber-500/30',
  info: 'border-brand-500/30',
};

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl border ${borders[toast.type]} shadow-2xl animate-fade-in-up max-w-md`}
      role="alert"
    >
      {icons[toast.type]}
      <span className="text-sm text-slate-900 dark:text-white flex-1">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="p-1 rounded-lg hover:bg-slate-900/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        aria-label="Fechar"
      >
        <X size={14} />
      </button>
    </div>
  );
};
