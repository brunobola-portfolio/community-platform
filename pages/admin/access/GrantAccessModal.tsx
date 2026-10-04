import React, { useEffect, useState } from 'react';
import { useAction } from 'convex/react';
import { ConvexError } from 'convex/values';
import { ShieldCheck, UserPlus, Users } from 'lucide-react';
import { Button, Modal, cn } from '../../../components/ui/UIComponents';
import { Field } from '../components/Field';
import { STD_INPUT_CLASS } from '../constants';
import { CredentialsCard } from './CredentialsCard';
import { api } from '../../../convex/_generated/api';

interface GrantAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    siteName: string;
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type Role = 'admin' | 'user';
type Result = { kind: 'created'; email: string; name: string; password: string };

const ROLES: Array<{ id: Role; title: string; text: string; icon: typeof ShieldCheck }> = [
    { id: 'admin', title: 'Administrador', text: 'Gere o site: eventos, notícias, inscrições e definições.', icon: ShieldCheck },
    { id: 'user', title: 'Sócio', text: 'Entra na área de sócio: cartão, quotas e documentos.', icon: Users },
];

export const GrantAccessModal: React.FC<GrantAccessModalProps> = ({ isOpen, onClose, siteName, notify }) => {
    const grant = useAction(api.access.grant);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<Role>('admin');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<Result | null>(null);

    useEffect(() => {
        if (isOpen) return;
        setEmail(''); setName(''); setRole('admin'); setError(''); setResult(null);
    }, [isOpen]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true); setError('');
        try {
            const res = await grant({ email, name: name || undefined, role });
            if (res.status === 'created') {
                setResult({ kind: 'created', email: email.trim().toLowerCase(), name, password: res.password });
                return;
            }
            const label = role === 'admin' ? 'administrador' : 'sócio';
            notify(res.status === 'updated' ? `A conta já existia e passou a ${label}.` : `Esta conta já é ${label}.`, res.status === 'updated' ? 'success' : 'info');
            onClose();
        } catch (err) {
            setError(err instanceof ConvexError ? String(err.data) : 'Não foi possível dar acesso. Tente de novo.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            icon={<UserPlus size={20} />}
            eyebrow="Acessos"
            title={result ? 'Acesso criado' : 'Dar acesso'}
            description={result
                ? `Envie estes dados a ${result.name || result.email}. Pode já entrar.`
                : 'Cria a conta com uma palavra-passe temporária. Se a pessoa já tiver conta, só muda o tipo de acesso.'}
            size="md"
            footer={result ? (
                <Button type="button" className="w-full" onClick={onClose}>Concluído</Button>
            ) : (
                <div className="flex gap-3">
                    <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" form="grant-access-form" className="flex-1" disabled={busy || !email}>
                        {busy ? 'A criar…' : 'Dar acesso'}
                    </Button>
                </div>
            )}
        >
            {result ? (
                <CredentialsCard email={result.email} password={result.password} name={result.name} siteName={siteName} />
            ) : (
                <form id="grant-access-form" onSubmit={submit} className="space-y-4">
                    {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
                    <Field label="Email"><input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} className={STD_INPUT_CLASS} placeholder="nome@exemplo.pt" /></Field>
                    <Field label="Nome (opcional)" hint="Aparece na saudação e no cartão de sócio."><input value={name} maxLength={80} onChange={e => setName(e.target.value)} className={STD_INPUT_CLASS} /></Field>
                    <fieldset>
                        <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Tipo de acesso</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {ROLES.map(r => (
                                <label
                                    key={r.id}
                                    className={cn(
                                        'flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-brand-500',
                                        role === r.id ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-black/20 hover:border-white/20',
                                    )}
                                >
                                    <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="sr-only" />
                                    <r.icon size={18} className={role === r.id ? 'text-brand-400' : 'text-slate-400'} />
                                    <span>
                                        <span className="block text-sm font-semibold text-white">{r.title}</span>
                                        <span className="block text-xs text-slate-400">{r.text}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </form>
            )}
        </Modal>
    );
};
