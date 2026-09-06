
/**
 * Sócios & Quotas admin tab.
 *
 * Self-contained: queries/mutates memberProfiles directly instead of going
 * through DataContext, since this dataset is admin-only and unrelated to the
 * public site data the context exists to serve.
 */

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { Plus, Wallet } from 'lucide-react';
import { Button, Modal, cn } from '../../components/ui/UIComponents';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { QuotaPill } from './components/QuotaPill';
import { EntityList } from './components/EntityList';
import type { ListFilter, ListSort } from '../../hooks/useAdminList';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { STD_INPUT_CLASS } from './constants';
import { Field } from './components/Field';

interface MemberProfileRow {
    id: Id<'memberProfiles'>;
    email: string;
    memberNumber: string;
    quotaPaidUntil: string;
    notes: string;
}

interface FormState {
    email: string;
    memberNumber: string;
    quotaPaidUntil: string;
    notes: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const FILTERS: ListFilter<MemberProfileRow>[] = [
    { key: 'all', label: 'Todos', predicate: () => true },
    { key: 'paid', label: 'Em dia', predicate: r => Number(r.quotaPaidUntil) >= CURRENT_YEAR },
    { key: 'late', label: 'Atrasada', predicate: r => Boolean(r.quotaPaidUntil) && Number(r.quotaPaidUntil) < CURRENT_YEAR },
    { key: 'none', label: 'Sem ano', predicate: r => !r.quotaPaidUntil },
];
const SORTS: ListSort<MemberProfileRow>[] = [
    { key: 'email', label: 'Email A–Z', compare: (a, b) => a.email.localeCompare(b.email, 'pt') },
    { key: 'number', label: 'Nº sócio', compare: (a, b) => (a.memberNumber || '').localeCompare(b.memberNumber || '', 'pt', { numeric: true }) },
    { key: 'year', label: 'Quota · mais recente', compare: (a, b) => (b.quotaPaidUntil || '').localeCompare(a.quotaPaidUntil || '') },
];

const EMPTY_FORM: FormState = { email: '', memberNumber: '', quotaPaidUntil: '', notes: '' };
export const AdminMemberQuotasTab: React.FC = () => {
    const profiles = useQuery(api.memberProfiles.list);
    const upsertProfile = useMutation(api.memberProfiles.upsert);
    const removeProfile = useMutation(api.memberProfiles.remove);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<Id<'memberProfiles'> | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingRemove, setPendingRemove] = useState<{ id: Id<'memberProfiles'>; email: string } | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const openNewModal = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setShowModal(true);
    };

    const openEditModal = (row: MemberProfileRow) => {
        setEditingId(row.id);
        setForm({ email: row.email, memberNumber: row.memberNumber, quotaPaidUntil: row.quotaPaidUntil, notes: row.notes });
        setFormError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormError(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setIsSaving(true);
        try {
            await upsertProfile({
                email: form.email,
                memberNumber: form.memberNumber || undefined,
                quotaPaidUntil: form.quotaPaidUntil || undefined,
                notes: form.notes || undefined,
            });
            closeModal();
        } catch (err) {
            setFormError(err instanceof ConvexError ? String(err.data) : 'Erro ao guardar.');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmRemove = async () => {
        if (!pendingRemove) return;
        setIsRemoving(true);
        try {
            await removeProfile({ id: pendingRemove.id });
        } finally {
            setIsRemoving(false);
            setPendingRemove(null);
        }
    };

    if (profiles === null) return null;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-end">
                <Button onClick={openNewModal} className="w-full shadow-lg md:w-auto">
                    <Plus size={18} /> Adicionar sócio
                </Button>
            </div>

            <EntityList<MemberProfileRow>
                items={profiles ?? []}
                isLoading={profiles === undefined}
                getKey={row => row.id}
                getTitle={row => row.email}
                getSubtitle={row => row.memberNumber ? `Nº ${row.memberNumber}` : 'Sem número de sócio'}
                getStatus={row => <QuotaPill year={row.quotaPaidUntil} />}
                search={row => `${row.email} ${row.memberNumber} ${row.notes}`}
                filters={FILTERS}
                sorts={SORTS}
                searchPlaceholder="Pesquisar por email ou nº de sócio"
                noun={['sócio', 'sócios']}
                columns={[
                    { header: 'Email', cell: row => <span className="font-medium text-white">{row.email}</span> },
                    { header: 'Nº sócio', cell: row => <span className="text-slate-400">{row.memberNumber || '—'}</span> },
                    { header: 'Quota paga até', cell: row => <QuotaPill year={row.quotaPaidUntil} /> },
                    { header: 'Notas', className: 'max-w-xs', cell: row => <span className="line-clamp-1 text-slate-400">{row.notes || '—'}</span> },
                ]}
                onEdit={openEditModal}
                onDelete={row => setPendingRemove({ id: row.id, email: row.email })}
                emptyIcon={Wallet}
                emptyTitle="Ainda não há registos de sócios"
                emptyDescription="Cada registo liga um email de sócio ao número e ao ano de quota mostrados na área reservada."
                onCreate={openNewModal}
                createLabel="Adicionar sócio"
            />

            {pendingRemove && (
                <DeleteConfirmDialog
                    deleteConfirm={{ type: 'memberProfile', id: pendingRemove.id, title: pendingRemove.email }}
                    isDeleting={isRemoving}
                    onCancel={() => setPendingRemove(null)}
                    onConfirm={confirmRemove}
                />
            )}

            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editingId ? 'Editar sócio' : 'Adicionar sócio'}
                eyebrow="Quotas"
                description="O email liga este registo à conta do portal; o ano indica até quando a quota está paga."
                icon={<Wallet size={20} />}
                size="md"
                footer={
                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={closeModal}>Cancelar</Button>
                        <Button type="submit" form="member-quota-form" className="flex-1" disabled={isSaving}>
                            {isSaving ? 'A guardar...' : 'Guardar'}
                        </Button>
                    </div>
                }
            >
                <form id="member-quota-form" onSubmit={handleSave} className="space-y-4">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
                            {formError}
                        </div>
                    )}
                    <Field label="Email"><input
                            type="email"
                            required
                            disabled={!!editingId}
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            className={cn(STD_INPUT_CLASS, editingId && 'opacity-60 cursor-not-allowed')}
                        /></Field>
                    <Field label="Nº Sócio"><input
                            type="text"
                            value={form.memberNumber}
                            onChange={(e) => setForm((f) => ({ ...f, memberNumber: e.target.value }))}
                            className={STD_INPUT_CLASS}
                        /></Field>
                    <Field label="Quota paga até"><input
                            type="text"
                            placeholder="2026"
                            value={form.quotaPaidUntil}
                            onChange={(e) => setForm((f) => ({ ...f, quotaPaidUntil: e.target.value }))}
                            className={STD_INPUT_CLASS}
                        /></Field>
                    <Field label="Notas"><textarea
                            rows={3}
                            value={form.notes}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            className={STD_INPUT_CLASS}
                        /></Field>
                </form>
            </Modal>
        </div>
    );
};
