import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { Loader2, UserPlus } from 'lucide-react';
import { Button, Modal } from '../../../components/ui/UIComponents';
import { Field } from '../components/Field';
import { STD_INPUT_CLASS } from '../constants';
import { describeActionError } from '../errors';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { Event } from '../../../types';

interface AddRegistrationModalProps {
    event: Event;
    onClose: () => void;
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const FORM_ID = 'admin-add-registration';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Draft {
    name: string;
    email: string;
    phone: string;
    teamName: string;
    teamMembers: string[];
    extra: Record<string, string>;
}

const EMPTY: Draft = { name: '', email: '', phone: '', teamName: '', teamMembers: [], extra: {} };

/**
 * For the call to the bar or the name given at a meeting: the board writes the
 * registration here, so the site's list, the door list and the places left stay
 * the one source. It is confirmed at once and allowed after the deadline.
 */
export const AddRegistrationModal: React.FC<AddRegistrationModalProps> = ({ event, onClose, notify }) => {
    const add = useMutation(api.registrations.addByAdmin);
    const [draft, setDraft] = useState<Draft>(EMPTY);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [count, setCount] = useState(0);
    const teamSize = event.teamSize ?? 1;
    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => { setDraft(d => ({ ...d, [key]: value })); setError(null); };

    const submit = async (another: boolean) => {
        if (!draft.name.trim()) { setError('Escreva o nome.'); return; }
        if (draft.email.trim() && !EMAIL.test(draft.email.trim())) { setError('Este email não parece válido. Deixe vazio se não o souber.'); return; }
        setSaving(true);
        try {
            await add({
                eventId: event.id as Id<'events'>,
                name: draft.name.trim(),
                email: draft.email.trim() || undefined,
                phone: draft.phone.trim() || undefined,
                customData: Object.keys(draft.extra).length ? draft.extra : undefined,
                ...(teamSize >= 2 ? { teamName: draft.teamName.trim() || undefined, teamMembers: draft.teamMembers.map(m => m.trim()) } : {}),
            });
            notify(`Inscrição de ${draft.name.trim()} guardada e confirmada.`);
            if (another) {
                setDraft(EMPTY);
                setCount(c => c + 1);
                requestAnimationFrame(() => document.getElementById(`${FORM_ID}-name`)?.focus());
            } else onClose();
        } catch (e) {
            // Rule messages (full, duplicate email) are written for people; anything else is translated
            setError(e instanceof ConvexError && typeof e.data === 'string'
                ? e.data
                : describeActionError(e instanceof Error ? e.message : String(e), 'Não foi possível guardar a inscrição.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            icon={<UserPlus size={20} />}
            eyebrow={event.title}
            title={teamSize >= 2 ? 'Adicionar equipa' : 'Adicionar inscrição'}
            description="Para quem se inscreveu por telefone ou em pessoa. Fica logo confirmada e conta para os lugares."
            size="md"
            footer={
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                    {count > 0 && <span className="text-xs text-emerald-400 sm:mr-auto">{count} {count === 1 ? 'adicionada' : 'adicionadas'} nesta janela</span>}
                    <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Fechar</Button>
                    <Button type="button" variant="outline" onClick={() => void submit(true)} disabled={saving} className="whitespace-nowrap">Guardar e outra</Button>
                    <Button type="submit" form={FORM_ID} disabled={saving} className="min-w-[120px]">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : 'Guardar'}
                    </Button>
                </div>
            }
        >
            <form id={FORM_ID} noValidate onSubmit={e => { e.preventDefault(); void submit(false); }} className="space-y-4">
                <Field label={teamSize >= 2 ? 'Nome do contacto (jogador 1)' : 'Nome'}>
                    <input id={`${FORM_ID}-name`} required autoFocus maxLength={200} value={draft.name} onChange={e => set('name', e.target.value)} className={STD_INPUT_CLASS} />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Telemóvel" hint="Para avisar no próprio dia.">
                        <input type="tel" inputMode="tel" maxLength={40} value={draft.phone} onChange={e => set('phone', e.target.value)} className={STD_INPUT_CLASS} />
                    </Field>
                    <Field label="Email (opcional)">
                        <input type="email" inputMode="email" maxLength={254} value={draft.email} onChange={e => set('email', e.target.value)} className={STD_INPUT_CLASS} />
                    </Field>
                </div>
                {teamSize >= 2 && (
                    <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                        <Field label="Nome da equipa (opcional)">
                            <input maxLength={100} value={draft.teamName} onChange={e => set('teamName', e.target.value)} className={STD_INPUT_CLASS} />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {Array.from({ length: teamSize - 1 }, (_, i) => (
                                <Field key={i} label={`Jogador ${i + 2}`} hint={i === 0 ? 'Pode ficar por preencher e completar depois por telefone.' : undefined}>
                                    <input maxLength={100} value={draft.teamMembers[i] ?? ''} onChange={e => { const next = [...draft.teamMembers]; next[i] = e.target.value; set('teamMembers', next); }} className={STD_INPUT_CLASS} />
                                </Field>
                            ))}
                        </div>
                    </div>
                )}
                {(event.registrationFields ?? []).map(f => (
                    <Field key={f.id} label={f.label}>
                        <input maxLength={1000} value={draft.extra[f.id] ?? ''} onChange={e => set('extra', { ...draft.extra, [f.id]: e.target.value })} className={STD_INPUT_CLASS} placeholder={f.placeholder} />
                    </Field>
                ))}
                {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            </form>
        </Modal>
    );
};
