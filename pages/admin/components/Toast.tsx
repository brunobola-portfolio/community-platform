
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../../components/ui/UIComponents';

export interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-[200] px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in-up backdrop-blur-md",
            type === 'success' ? "bg-green-900/90 border-green-500/50 text-green-100" : "bg-red-900/90 border-red-500/50 text-red-100"
        )}>
            {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{message}</span>
        </div>
    );
};
