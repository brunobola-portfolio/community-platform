
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
const CURRENT_YEAR = new Date().getFullYear();

const QuotaPill: React.FC<{ year: string }> = ({ year }) => {
    if (!year) return <span className="text-slate-500 text-xs">—</span>;
    const isUpToDate = Number(year) >= CURRENT_YEAR;
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                isUpToDate
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            )}
        >
            {year} · {isUpToDate ? 'Em dia' : 'Atrasada'}
        </span>
    );
};

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
    const [pendingRemoveId, setPendingRemoveId] = useState<Id<'memberProfiles'> | null>(null);

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

    // Two-step confirm: first click arms it, a second click within 3s removes it
    const handleRemoveClick = (id: Id<'memberProfiles'>) => {
        if (pendingRemoveId !== id) {
            setPendingRemoveId(id);
            setTimeout(() => setPendingRemoveId((current) => (current === id ? null : current)), 3000);
            return;
        }
        setPendingRemoveId(null);
        void removeProfile({ id });
    };

    if (profiles === null) return null;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                        Registos de quotas dos sócios, associados por email à conta do portal. Um sócio sem registo
                        aqui vê "Sem registo" na Área de Sócio.
                    </p>
                </div>
                <Button onClick={openNewModal} className="shadow-lg w-full md:w-auto">
                    <Plus size={18} className="mr-2" /> Adicionar Sócio
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
                <div className="text-center py-16 bg-dark-surface border border-dashed border-white/10 rounded-2xl">
                    <Wallet size={32} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 mb-4">Ainda não há registos de sócios.</p>
                    <Button onClick={openNewModal} variant="outline">
                        <Plus size={16} className="mr-2" /> Adicionar Sócio
                    </Button>
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
                                                    onClick={() => handleRemoveClick(row.id)}
                                                    aria-label={`Remover ${row.email}`}
                                                    className={cn(
                                                        'focus-visible:ring-2 focus-visible:ring-brand-500',
                                                        pendingRemoveId === row.id ? 'text-amber-400' : 'text-red-400'
                                                    )}
                                                >
                                                    {pendingRemoveId === row.id ? 'Confirmar?' : <Trash2 size={16} />}
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

            <Modal isOpen={showModal} onClose={closeModal} title={editingId ? 'Editar Sócio' : 'Adicionar Sócio'}>
                <form onSubmit={handleSave} className="space-y-4">
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
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" className="flex-1" onClick={closeModal}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSaving}>
                            {isSaving ? 'A guardar...' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
