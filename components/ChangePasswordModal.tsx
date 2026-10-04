import React, { useEffect, useState } from 'react';
import { useAction } from 'convex/react';
import { ConvexError } from 'convex/values';
import { CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button, Input } from './ui/UIComponents';
import { Modal } from './ui/Modal';
import { api } from '../convex/_generated/api';
import { passwordProblem } from '../convex/lib/accessRules';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LABEL = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

/** Replaces the signed-in person's password; used by the member area and the backoffice. */
export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const changePassword = useAction(api.access.changeOwnPassword);
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [visible, setVisible] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    // Passwords must not survive a closed dialog (shared computers at the association)
    useEffect(() => {
        if (isOpen) return;
        setCurrent(''); setNext(''); setConfirm(''); setError(''); setDone(false); setVisible(false);
    }, [isOpen]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (busy) return;
        const problem = passwordProblem(next);
        if (problem) { setError(problem); return; }
        if (next !== confirm) { setError('A confirmação não coincide com a nova palavra-passe.'); return; }
        setBusy(true); setError('');
        try {
            await changePassword({ current, next });
            setDone(true);
        } catch (err) {
            setError(err instanceof ConvexError ? String(err.data) : 'Não foi possível alterar a palavra-passe. Tente de novo.');
        } finally {
            setBusy(false);
        }
    };

    const type = visible ? 'text' : 'password';
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            icon={<KeyRound size={20} />}
            eyebrow="A minha conta"
            title="Alterar palavra-passe"
            description={done ? undefined : 'Use pelo menos 10 caracteres, com maiúsculas, minúsculas e um número. As outras sessões abertas terminam.'}
            size="sm"
            footer={done ? (
                <Button type="button" className="w-full" onClick={onClose}>Fechar</Button>
            ) : (
                <div className="flex gap-3">
                    <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" form="change-password-form" className="flex-1" disabled={busy || !current || !next || !confirm}>
                        {busy ? 'A guardar…' : 'Guardar'}
                    </Button>
                </div>
            )}
        >
            {done ? (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <p>Palavra-passe alterada. Use-a da próxima vez que entrar.</p>
                </div>
            ) : (
                <form id="change-password-form" onSubmit={submit} className="space-y-4">
                    {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
                    <div>
                        <label htmlFor="pw-current" className={LABEL}>Palavra-passe atual</label>
                        <Input id="pw-current" type={type} autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="pw-next" className={LABEL}>Nova palavra-passe</label>
                        <Input id="pw-next" type={type} autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} required minLength={10} />
                    </div>
                    <div>
                        <label htmlFor="pw-confirm" className={LABEL}>Confirmar nova palavra-passe</label>
                        <Input id="pw-confirm" type={type} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                    </div>
                    <button
                        type="button"
                        onClick={() => setVisible(v => !v)}
                        className="inline-flex items-center gap-2 rounded-lg px-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                        {visible ? <EyeOff size={14} /> : <Eye size={14} />} {visible ? 'Ocultar' : 'Mostrar'} palavras-passe
                    </button>
                </form>
            )}
        </Modal>
    );
};
