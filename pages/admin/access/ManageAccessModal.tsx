import React, { useEffect, useState } from 'react';
import { useAction, useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { KeyRound, ShieldCheck, UserCog, Users } from 'lucide-react';
import { Button, Modal } from '../../../components/ui/UIComponents';
import { CredentialsCard } from './CredentialsCard';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

export interface AccessRow {
    id: Id<'users'>;
    email: string;
    name: string;
    role: 'admin' | 'user';
    createdAt: number;
    isSelf: boolean;
}

interface ManageAccessModalProps {
    row: AccessRow | null;
    onClose: () => void;
    siteName: string;
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const message = (err: unknown, fallback: string) => (err instanceof ConvexError ? String(err.data) : fallback);

/** Role change and password reset for one account. */
export const ManageAccessModal: React.FC<ManageAccessModalProps> = ({ row, onClose, siteName, notify }) => {
    const setRole = useMutation(api.access.setRole);
    const resetPassword = useAction(api.access.resetPassword);
    const [busy, setBusy] = useState<'role' | 'reset' | null>(null);
    const [password, setPassword] = useState<string | null>(null);

    useEffect(() => { setPassword(null); setBusy(null); }, [row?.id]);

    if (!row) return null;
    const nextRole = row.role === 'admin' ? 'user' : 'admin';

    const changeRole = async () => {
        setBusy('role');
        try {
            await setRole({ userId: row.id, role: nextRole });
            notify(nextRole === 'admin' ? `${row.email} passou a administrador.` : `${row.email} deixou de ser administrador.`);
            onClose();
        } catch (err) {
            notify(message(err, 'Não foi possível mudar o acesso.'), 'error');
        } finally {
            setBusy(null);
        }
    };

    const reset = async () => {
        setBusy('reset');
        try {
            const res = await resetPassword({ userId: row.id });
            setPassword(res.password);
        } catch (err) {
            notify(message(err, 'Não foi possível gerar uma nova palavra-passe.'), 'error');
        } finally {
            setBusy(null);
        }
    };

    return (
        <Modal
            isOpen={Boolean(row)}
            onClose={onClose}
            icon={<UserCog size={20} />}
            eyebrow={row.role === 'admin' ? 'Administrador' : 'Sócio'}
            title={row.name || row.email}
            description={password ? 'Nova palavra-passe criada. As sessões abertas desta conta terminaram.' : row.email}
            size="md"
            footer={<Button type="button" className="w-full" variant={password ? 'default' : 'ghost'} onClick={onClose}>{password ? 'Concluído' : 'Fechar'}</Button>}
        >
            {password ? (
                <CredentialsCard email={row.email} password={password} name={row.name} siteName={siteName} />
            ) : (
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-white">
                                {row.role === 'admin' ? <ShieldCheck size={16} className="text-amber-300" /> : <Users size={16} className="text-slate-400" />}
                                {row.role === 'admin' ? 'Gere o site' : 'Só área de sócio'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                {row.isSelf ? 'É a sua conta: outro administrador pode mudar o seu acesso.' : nextRole === 'admin' ? 'Passa a ver o backoffice completo.' : 'Deixa de entrar no backoffice; mantém a área de sócio.'}
                            </p>
                        </div>
                        {!row.isSelf && (
                            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={changeRole} className="shrink-0">
                                {busy === 'role' ? 'A mudar…' : nextRole === 'admin' ? 'Tornar administrador' : 'Retirar administração'}
                            </Button>
                        )}
                    </div>
                    {!row.isSelf && (
                        <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold text-white"><KeyRound size={16} className="text-slate-400" /> Esqueceu-se da palavra-passe?</p>
                                <p className="mt-1 text-xs text-slate-400">Gera uma palavra-passe temporária nova e termina as sessões abertas.</p>
                            </div>
                            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={reset} className="shrink-0">
                                {busy === 'reset' ? 'A gerar…' : 'Nova palavra-passe'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};
