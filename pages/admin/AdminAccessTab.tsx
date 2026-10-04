/**
 * Acessos admin tab: who can sign in to the portal and who runs the site.
 *
 * Self-contained like the quotas tab: the users list is admin-only and has
 * nothing to do with the public data DataContext serves.
 */
import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { Button, cn } from '../../components/ui/UIComponents';
import { EntityList } from './components/EntityList';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { GrantAccessModal } from './access/GrantAccessModal';
import { ManageAccessModal, type AccessRow } from './access/ManageAccessModal';
import type { ListFilter, ListSort } from '../../hooks/useAdminList';
import { api } from '../../convex/_generated/api';

interface AdminAccessTabProps {
    siteName: string;
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const FILTERS: ListFilter<AccessRow>[] = [
    { key: 'all', label: 'Todos', predicate: () => true },
    { key: 'admin', label: 'Administradores', predicate: r => r.role === 'admin' },
    { key: 'user', label: 'Sócios', predicate: r => r.role === 'user' },
];
const SORTS: ListSort<AccessRow>[] = [
    { key: 'role', label: 'Administradores primeiro', compare: (a, b) => (a.role === b.role ? b.createdAt - a.createdAt : a.role === 'admin' ? -1 : 1) },
    { key: 'recent', label: 'Mais recentes', compare: (a, b) => b.createdAt - a.createdAt },
    { key: 'email', label: 'Email A–Z', compare: (a, b) => a.email.localeCompare(b.email, 'pt') },
];

const RolePill: React.FC<{ row: AccessRow }> = ({ row }) => (
    <span className="inline-flex items-center gap-2">
        <span className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
            row.role === 'admin' ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-300',
        )}>
            {row.role === 'admin' && <ShieldCheck size={12} />}{row.role === 'admin' ? 'Administrador' : 'Sócio'}
        </span>
        {row.isSelf && <span className="text-[11px] text-slate-400">(você)</span>}
    </span>
);

export const AdminAccessTab: React.FC<AdminAccessTabProps> = ({ siteName, notify }) => {
    const rows = useQuery(api.access.list) as AccessRow[] | undefined;
    const removeUser = useMutation(api.access.remove);
    const [granting, setGranting] = useState(false);
    const [managing, setManaging] = useState<AccessRow | null>(null);
    const [pendingRemove, setPendingRemove] = useState<AccessRow | null>(null);
    const [removing, setRemoving] = useState(false);

    const confirmRemove = async () => {
        if (!pendingRemove) return;
        setRemoving(true);
        try {
            await removeUser({ userId: pendingRemove.id });
            notify(`A conta ${pendingRemove.email} foi removida.`);
        } catch (err) {
            notify(err instanceof ConvexError ? String(err.data) : 'Não foi possível remover a conta.', 'error');
        } finally {
            setRemoving(false);
            setPendingRemove(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-dark-surface p-5 md:flex-row md:items-center md:justify-between">
                <p className="flex items-start gap-3 text-sm text-slate-300">
                    <KeyRound size={18} className="mt-0.5 shrink-0 text-brand-400" />
                    Dê acesso a quem gere o site ou a sócios. A pessoa recebe uma palavra-passe temporária e muda-a depois de entrar.
                </p>
                <Button onClick={() => setGranting(true)} className="w-full shrink-0 shadow-lg md:w-auto">
                    <UserPlus size={18} /> Dar acesso
                </Button>
            </div>

            <EntityList<AccessRow>
                items={rows ?? []}
                isLoading={rows === undefined}
                getKey={row => row.id}
                getTitle={row => row.name || row.email}
                getSubtitle={row => (row.name ? row.email : undefined)}
                getStatus={row => <RolePill row={row} />}
                search={row => `${row.name} ${row.email}`}
                filters={FILTERS}
                sorts={SORTS}
                searchPlaceholder="Pesquisar por nome ou email"
                noun={['conta', 'contas']}
                columns={[
                    { header: 'Pessoa', cell: row => (
                        <span className="block">
                            <span className="block font-medium text-white">{row.name || row.email}</span>
                            {row.name && <span className="block text-xs text-slate-400">{row.email}</span>}
                        </span>
                    ) },
                    { header: 'Acesso', cell: row => <RolePill row={row} /> },
                    { header: 'Criada', cell: row => <span className="text-slate-400">{new Date(row.createdAt).toLocaleDateString('pt-PT')}</span> },
                ]}
                editLabel="Gerir"
                onEdit={setManaging}
                onDelete={row => {
                    if (row.isSelf) { notify('Não pode remover a sua própria conta.', 'info'); return; }
                    setPendingRemove(row);
                }}
                emptyIcon={UserPlus}
                emptyTitle="Ainda não há contas"
                emptyDescription="Dê acesso à direção ou aos sócios: cada pessoa recebe uma palavra-passe temporária."
                onCreate={() => setGranting(true)}
                createLabel="Dar acesso"
            />

            <GrantAccessModal isOpen={granting} onClose={() => setGranting(false)} siteName={siteName} notify={notify} />
            <ManageAccessModal row={managing} onClose={() => setManaging(null)} siteName={siteName} notify={notify} />
            {pendingRemove && (
                <DeleteConfirmDialog
                    deleteConfirm={{ type: 'account', id: pendingRemove.id, title: pendingRemove.email }}
                    isDeleting={removing}
                    onCancel={() => setPendingRemove(null)}
                    onConfirm={confirmRemove}
                />
            )}
        </div>
    );
};
