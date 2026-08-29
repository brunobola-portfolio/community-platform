import React from 'react';
import { CheckCircle2, ClipboardList, XCircle } from 'lucide-react';
import { Badge, Button, Modal } from '../../../components/ui/UIComponents';
import type { Registration } from '../../../types';

interface RegistrationModalProps {
    registration: Registration;
    onClose: () => void;
    onConfirm: (id: string) => void;
    onCancel: (id: string) => void;
    isBusy?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-widest text-slate-500">{label}</dt>
        <dd className="mt-0.5 truncate text-sm text-white">{value}</dd>
    </div>
);

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ registration, onClose, onConfirm, onCancel, isBusy = false }) => {
    const entries = Object.entries(registration.customData ?? {});
    const decided = registration.status !== 'pending';

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={registration.name ?? 'Inscrição'}
            eyebrow="Inscrição em evento"
            description={decided ? `Esta inscrição está ${STATUS_LABELS[registration.status]?.toLowerCase() ?? registration.status}.` : 'Confirme a inscrição depois de validar o pagamento ou os dados.'}
            icon={<ClipboardList size={20} />}
            size="md"
            footer={
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button variant="ghost" className="text-red-400 hover:text-red-300" disabled={isBusy} onClick={() => onCancel(registration.id)}>
                        <XCircle size={16} /> Cancelar inscrição
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-500" disabled={isBusy} onClick={() => onConfirm(registration.id)}>
                        <CheckCircle2 size={16} /> Confirmar
                    </Button>
                </div>
            }
        >
            <div className="space-y-5">
                <dl className="grid grid-cols-2 gap-4">
                    <Field label="Nome" value={registration.name ?? '—'} />
                    <Field label="Email" value={registration.email ?? '—'} />
                    <Field label="Data" value={registration.timestamp ? new Date(registration.timestamp).toLocaleString('pt-PT') : '—'} />
                    <Field
                        label="Estado"
                        value={
                            <Badge className={registration.status === 'confirmed'
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                : registration.status === 'cancelled'
                                    ? 'border-red-500/20 bg-red-500/10 text-red-400'
                                    : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}>
                                {STATUS_LABELS[registration.status] ?? registration.status}
                            </Badge>
                        }
                    />
                </dl>

                <div>
                    <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-400">Dados preenchidos</h4>
                    {entries.length === 0 ? (
                        <p className="rounded-xl bg-black/20 p-3 text-sm text-slate-500">
                            Este evento não pedia dados adicionais.
                        </p>
                    ) : (
                        <dl className="divide-y divide-white/5 rounded-xl bg-black/20 px-3">
                            {entries.map(([key, value]) => (
                                <div key={key} className="flex items-start justify-between gap-4 py-2 text-sm">
                                    <dt className="capitalize text-slate-400">{key.replace(/_/g, ' ')}</dt>
                                    <dd className="break-words text-right font-medium text-white">{String(value)}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </div>
            </div>
        </Modal>
    );
};
