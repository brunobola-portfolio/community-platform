import React from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button, Modal } from '../../../components/ui/UIComponents';

export interface DeleteConfirmState {
    type: string;
    id: string;
    title: string;
}

export interface DeleteConfirmDialogProps {
    deleteConfirm: DeleteConfirmState;
    onCancel: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}

/**
 * Consequences worth spelling out before the admin confirms: deletes that take
 * related records or stored files with them.
 */
const CASCADE_NOTES: Record<string, string> = {
    album: 'As fotografias do álbum são apagadas do armazenamento e desaparecem da galeria pública.',
    event: 'As inscrições associadas a este evento são apagadas com ele.',
    category: 'Os eventos e notícias desta categoria passam a ficar sem categoria.',
    member: 'O membro deixa de aparecer na página Equipa.',
    tier: 'Os parceiros neste nível mantêm-se, mas o nível deixa de estar disponível no formulário.',
    sponsor: 'O parceiro deixa de aparecer na faixa de apoios do portal.',
    memberProfile: 'O sócio passa a ver "sem registo" na área reservada até ser criado um novo registo.',
    contactSubmission: 'A mensagem é removida do backoffice; o email do remetente continua no histórico da caixa de correio.',
    sponsorshipRequest: 'O pedido de parceria deixa de constar na lista de leads.',
    galleryPhotos: 'Os ficheiros saem do armazenamento e desaparecem da galeria pública. Não há forma de os recuperar.',
};

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ deleteConfirm, onCancel, onConfirm, isDeleting = false }) => (
    <Modal
        isOpen
        onClose={isDeleting ? () => undefined : onCancel}
        title="Apagar definitivamente?"
        eyebrow="Ação irreversível"
        description={`Vai remover "${deleteConfirm.title}". Esta ação não pode ser anulada.`}
        icon={<AlertTriangle size={20} />}
        size="sm"
        footer={
            <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={isDeleting}>Cancelar</Button>
                <Button className="flex-1 border-red-500/50 bg-red-600 hover:bg-red-500" onClick={onConfirm} disabled={isDeleting}>
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Apagar</>}
                </Button>
            </div>
        }
    >
        <p className="text-sm leading-relaxed text-slate-400">
            {CASCADE_NOTES[deleteConfirm.type] ?? 'O registo é removido do portal imediatamente.'}
        </p>
    </Modal>
);
