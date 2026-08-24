
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';

export interface DeleteConfirmState {
    type: string;
    id: string;
    title: string;
}

export interface DeleteConfirmDialogProps {
    deleteConfirm: DeleteConfirmState;
    onCancel: () => void;
    onConfirm: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ deleteConfirm, onCancel, onConfirm }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in-up">
        <div className="bg-dark-surface border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tem a certeza?</h3>
            <p className="text-slate-400 text-sm mb-6">
                Vai apagar permanentemente <span className="text-white font-bold">"{deleteConfirm.title}"</span>.
            </p>
            <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={onCancel}>Cancelar</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-500 text-white" onClick={onConfirm}>Apagar</Button>
            </div>
        </div>
    </div>
);
