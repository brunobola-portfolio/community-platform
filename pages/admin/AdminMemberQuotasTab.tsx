
/**
 * Sócios & Quotas admin tab.
 *
 * Self-contained: queries/mutates memberProfiles directly instead of going
 * through DataContext, since this dataset is admin-only and unrelated to the
 * public site data the context exists to serve.
 */

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { Edit2, Plus, Search, Trash2, Wallet } from 'lucide-react';
import { Button, Modal, cn } from '../../components/ui/UIComponents';
import { EmptyState } from '../../components/ui/EmptyState';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { QuotaPill } from './components/QuotaPill';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { LABEL_CLASS, STD_INPUT_CLASS } from './constants';

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

const EMPTY_FORM: FormState = { email: '', memberNumber: '', quotaPaidUntil: '', notes: '' };
export const AdminMemberQuotasTab: React.FC = () => {
    const profiles = useQuery(api.memberProfiles.list);
    const upsertProfile = useMutation(api.memberProfiles.upsert);
    const removeProfile = useMutation(api.memberProfiles.remove);

    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<Id<'memberProfiles'> | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingRemove, setPendingRemove] = useState<{ id: Id<'memberProfiles'>; email: string } | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const filtered = useMemo<MemberProfileRow[]>(() => {
        if (!profiles) return [];
        const term = search.trim().toLowerCase();
        if (!term) return profiles;
        return profiles.filter(
            (p) => p.email.toLowerCase().includes(term) || p.memberNumber.toLowerCase().includes(term)
        );
    }, [profiles, search]);

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

            {profiles === undefined && (
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-14 bg-dark-surface border border-white/10 rounded-2xl animate-pulse" />
                    ))}
                </div>
            )}

            {profiles !== undefined && profiles.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-dark-surface">
                    <EmptyState
                        icon={Wallet}
                        title="Ainda não há registos de sócios"
                        description="Cada registo liga um email de sócio ao número e ao ano de quota mostrados na área reservada."
                        action={{ label: 'Adicionar sócio', onClick: openNewModal }}
                    />
                </div>
            )}

            {profiles !== undefined && profiles.length > 0 && (
                <>
                    <div className="relative max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Pesquisar por email ou nº sócio..."
                            className={cn(STD_INPUT_CLASS, 'pl-9')}
                        />
                    </div>

                    <div className="bg-dark-surface border border-white/10 rounded-2xl overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-white/5 text-slate-400">
                                <tr>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Nº Sócio</th>
                                    <th className="p-4">Quota paga até</th>
                                    <th className="p-4">Notas</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((row) => (
                                    <tr key={row.id} className="hover:bg-white/[0.02]">
                                        <td className="p-4 text-white font-medium">{row.email}</td>
                                        <td className="p-4 text-slate-400">{row.memberNumber || '—'}</td>
                                        <td className="p-4">
                                            <QuotaPill year={row.quotaPaidUntil} />
                                        </td>
                                        <td className="p-4 text-slate-400 max-w-xs">
                                            <span className="line-clamp-1">{row.notes || '—'}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openEditModal(row)}
                                                    aria-label={`Editar ${row.email}`}
                                                    className="focus-visible:ring-2 focus-visible:ring-brand-500"
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setPendingRemove({ id: row.id, email: row.email })}
                                                    aria-label={`Remover ${row.email}`}
                                                    title="Remover"
                                                    className="text-red-400 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-brand-500"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-slate-500">
                                            Sem resultados para "{search}".
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

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
                    <div>
                        <label className={LABEL_CLASS}>Email</label>
                        <input
                            type="email"
                            required
                            disabled={!!editingId}
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            className={cn(STD_INPUT_CLASS, editingId && 'opacity-60 cursor-not-allowed')}
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Nº Sócio</label>
                        <input
                            type="text"
                            value={form.memberNumber}
                            onChange={(e) => setForm((f) => ({ ...f, memberNumber: e.target.value }))}
                            className={STD_INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Quota paga até</label>
                        <input
                            type="text"
                            placeholder="2026"
                            value={form.quotaPaidUntil}
                            onChange={(e) => setForm((f) => ({ ...f, quotaPaidUntil: e.target.value }))}
                            className={STD_INPUT_CLASS}
                        />
                    </div>
                    <div>
                        <label className={LABEL_CLASS}>Notas</label>
                        <textarea
                            rows={3}
                            value={form.notes}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            className={STD_INPUT_CLASS}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};
