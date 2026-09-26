import React from 'react';
import { CheckCircle2, ClipboardList, Mail, MessageCircle, XCircle } from 'lucide-react';
import { Badge, Button, Modal } from '../../../components/ui/UIComponents';
import type { Registration } from '../../../types';

interface RegistrationModalProps {
    registration: Registration;
    onClose: () => void;
    onConfirm: (id: string) => void;
    onCancel: (id: string) => void;
    isBusy?: boolean;
    /** The event's own fields, so answers show under their labels and not their ids. */
    fields?: Array<{ id: string; label: string }>;
    eventTitle?: string;
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-widest text-slate-400">{label}</dt>
        <dd className="mt-0.5 truncate text-sm text-white">{value}</dd>
    </div>
);

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ registration, onClose, onConfirm, onCancel, isBusy = false, fields = [], eventTitle }) => {
    const labels = new Map(fields.map(f => [f.id, f.label]));
    // Older registrations stored name and email among the answers; they already show above
    const entries = Object.entries(registration.customData ?? {}).filter(([key]) => key !== 'name' && key !== 'email');
    const decided = registration.status !== 'pending';
    // Portuguese numbers without the country code are the usual case
    const digits = (registration.phone ?? '').replace(/\D/g, '');
    const whatsappNumber = digits.length === 9 ? `351${digits}` : digits.length > 9 ? digits : '';

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={registration.name ?? 'Inscrição'}
            eyebrow={eventTitle ?? 'Inscrição em evento'}
            description={`${decided ? `Esta inscrição está ${STATUS_LABELS[registration.status]?.toLowerCase() ?? registration.status}.` : 'Confirme depois de validar os dados ou o pagamento.'} Confirmar ou cancelar só muda o estado aqui: a pessoa não recebe aviso automático — use os contactos abaixo se for preciso.`}
            icon={<ClipboardList size={20} />}
            size="md"
            footer={
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {registration.status !== 'cancelled' && (
                        <Button variant="ghost" className="text-red-400 hover:text-red-300" disabled={isBusy} onClick={() => onCancel(registration.id)}>
                            <XCircle size={16} /> Cancelar inscrição
                        </Button>
                    )}
                    {registration.status !== 'confirmed' && (
                        <Button className="bg-emerald-700 hover:bg-emerald-800" disabled={isBusy} onClick={() => onConfirm(registration.id)}>
                            <CheckCircle2 size={16} /> {registration.status === 'cancelled' ? 'Reativar inscrição' : 'Confirmar'}
                        </Button>
                    )}
                </div>
            }
        >
            <div className="space-y-5">
                <dl className="grid grid-cols-2 gap-4">
                    <Field label="Nome" value={registration.name ?? '—'} />
                    <Field label="Email" value={registration.email ?? '—'} />
                    <Field label="Telemóvel" value={registration.phone || '—'} />
                    <Field label="Data" value={registration.timestamp ? new Date(registration.timestamp).toLocaleString('pt-PT') : '—'} />
                    <Field label="Conta" value={registration.userId ? 'Sócio com sessão' : 'Sem conta'} />
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

                {(registration.email || registration.phone) && (
                    <div className="flex flex-wrap gap-2">
                        {registration.email && (
                            <a href={`mailto:${registration.email}?subject=${encodeURIComponent(`Inscrição: ${eventTitle ?? 'evento'}`)}`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                <Mail size={16} /> Enviar email
                            </a>
                        )}
                        {whatsappNumber && (
                            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                <MessageCircle size={16} /> WhatsApp
                            </a>
                        )}
                    </div>
                )}

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
                                    <dt className="text-slate-400">{labels.get(key) ?? key.replace(/_/g, ' ')}</dt>
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
