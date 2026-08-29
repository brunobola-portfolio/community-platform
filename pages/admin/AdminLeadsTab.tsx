import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Mail, Phone, Clock, Trash2, CheckCircle, X, Archive, Inbox, Handshake } from 'lucide-react';
import { Button, Badge, cn } from '../../components/ui/UIComponents';
import { EmptyState } from '../../components/ui/EmptyState';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import type { Id } from '../../convex/_generated/dataModel';

type ContactStatus = 'pending' | 'replied' | 'archived';
type SponsorshipStatus = 'pending' | 'contacted' | 'confirmed' | 'rejected';

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    replied: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
    archived: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    contacted: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
    confirmed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    replied: 'Respondido',
    archived: 'Arquivado',
    contacted: 'Contactado',
    confirmed: 'Confirmado',
    rejected: 'Rejeitado',
};

const formatTimestamp = (ts: number) =>
    new Date(ts).toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export const AdminLeadsTab: React.FC = () => {
    const [section, setSection] = useState<'contact' | 'sponsorship'>('contact');
    const [pendingDelete, setPendingDelete] = useState<{ kind: 'contact' | 'sponsorship'; id: string; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const contacts = useQuery(api.contact.list);
    const sponsorships = useQuery(api.sponsorshipRequests.list);

    const updateContactStatus = useMutation(api.contact.updateStatus);
    const removeContact = useMutation(api.contact.remove);
    const updateSponsorshipStatus = useMutation(api.sponsorshipRequests.updateStatus);
    const removeSponsorship = useMutation(api.sponsorshipRequests.remove);

    const pendingContactCount = contacts?.filter(c => c.status === 'pending').length ?? 0;
    const pendingSponsorshipCount = sponsorships?.filter(s => s.status === 'pending').length ?? 0;

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        setIsDeleting(true);
        try {
            if (pendingDelete.kind === 'contact') await removeContact({ id: pendingDelete.id as Id<'contactSubmissions'> });
            else await removeSponsorship({ id: pendingDelete.id as Id<'sponsorshipRequests'> });
        } finally {
            setIsDeleting(false);
            setPendingDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b border-white/5 pb-px">
                <button
                    onClick={() => setSection('contact')}
                    className={cn(
                        'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                        section === 'contact'
                            ? 'bg-brand-600/20 text-brand-300 border-b-2 border-brand-500'
                            : 'text-slate-400 hover:text-white'
                    )}
                >
                    Contactos
                    {pendingContactCount > 0 && (
                        <Badge className="ml-2 bg-amber-500 text-black text-xs">{pendingContactCount}</Badge>
                    )}
                </button>
                <button
                    onClick={() => setSection('sponsorship')}
                    className={cn(
                        'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                        section === 'sponsorship'
                            ? 'bg-brand-600/20 text-brand-300 border-b-2 border-brand-500'
                            : 'text-slate-400 hover:text-white'
                    )}
                >
                    Pedidos de Parceria
                    {pendingSponsorshipCount > 0 && (
                        <Badge className="ml-2 bg-amber-500 text-black text-xs">{pendingSponsorshipCount}</Badge>
                    )}
                </button>
            </div>

            {section === 'contact' && (
                <div className="space-y-3">
                    {contacts === undefined && [0, 1, 2].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />)}
                    {contacts !== undefined && contacts.length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-dark-surface">
                            <EmptyState
                                icon={Inbox}
                                title="Sem mensagens de contacto"
                                description="As mensagens enviadas pelo formulário público do portal aparecem aqui."
                            />
                        </div>
                    )}
                    {contacts?.map(c => (
                        <div key={c._id} className="bg-dark-surface border border-white/10 rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-white font-medium">{c.name}</h3>
                                        <Badge className={cn('text-xs', STATUS_STYLES[c.status])}>
                                            {STATUS_LABELS[c.status]}
                                        </Badge>
                                    </div>
                                    <div className="text-slate-400 text-sm mt-1 flex items-center gap-3 flex-wrap">
                                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-brand-400">
                                            <Mail size={14} /> {c.email}
                                        </a>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} /> {formatTimestamp(c.timestamp)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {c.status !== 'replied' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => updateContactStatus({ id: c._id, status: 'replied' as ContactStatus })}
                                            className="text-brand-400 hover:text-brand-300"
                                        >
                                            <CheckCircle size={14} className="mr-1" /> Marcar respondido
                                        </Button>
                                    )}
                                    {c.status !== 'archived' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => updateContactStatus({ id: c._id, status: 'archived' as ContactStatus })}
                                        >
                                            <Archive size={14} className="mr-1" /> Arquivar
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        aria-label={`Apagar mensagem de ${c.name}`}
                                        title="Apagar"
                                        onClick={() => setPendingDelete({ kind: 'contact', id: c._id, title: c.name })}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-black/20 rounded-lg p-3 mt-2">
                                <div className="text-xs text-slate-500 mb-1 font-mono uppercase tracking-wider">
                                    {c.subject}
                                </div>
                                <p className="text-slate-300 text-sm whitespace-pre-wrap">{c.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {section === 'sponsorship' && (
                <div className="space-y-3">
                    {sponsorships === undefined && [0, 1, 2].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />)}
                    {sponsorships !== undefined && sponsorships.length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-dark-surface">
                            <EmptyState
                                icon={Handshake}
                                title="Sem pedidos de parceria"
                                description="Os pedidos submetidos no formulário “Torne-se Parceiro” do portal aparecem aqui."
                            />
                        </div>
                    )}
                    {sponsorships?.map(s => (
                        <div key={s._id} className="bg-dark-surface border border-white/10 rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-white font-medium">{s.name}</h3>
                                        <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs uppercase">
                                            {s.tier}
                                        </Badge>
                                        <Badge className={cn('text-xs', STATUS_STYLES[s.status])}>
                                            {STATUS_LABELS[s.status]}
                                        </Badge>
                                    </div>
                                    <div className="text-slate-400 text-sm mt-1 flex items-center gap-3 flex-wrap">
                                        <a href={`mailto:${s.email}`} className="flex items-center gap-1 hover:text-brand-400">
                                            <Mail size={14} /> {s.email}
                                        </a>
                                        <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-brand-400">
                                            <Phone size={14} /> {s.phone}
                                        </a>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} /> {formatTimestamp(s.timestamp)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {s.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => updateSponsorshipStatus({ id: s._id, status: 'contacted' as SponsorshipStatus })}
                                            className="text-brand-400 hover:text-brand-300"
                                        >
                                            Marcar contactado
                                        </Button>
                                    )}
                                    {s.status !== 'confirmed' && s.status !== 'rejected' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => updateSponsorshipStatus({ id: s._id, status: 'confirmed' as SponsorshipStatus })}
                                                className="text-emerald-400 hover:text-emerald-300"
                                            >
                                                <CheckCircle size={14} className="mr-1" /> Confirmar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => updateSponsorshipStatus({ id: s._id, status: 'rejected' as SponsorshipStatus })}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <X size={14} className="mr-1" /> Rejeitar
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        aria-label={`Apagar pedido de ${s.name}`}
                                        title="Apagar"
                                        onClick={() => setPendingDelete({ kind: 'sponsorship', id: s._id, title: s.name })}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {pendingDelete && (
                <DeleteConfirmDialog
                    deleteConfirm={{ type: pendingDelete.kind === 'contact' ? 'contactSubmission' : 'sponsorshipRequest', id: pendingDelete.id, title: pendingDelete.title }}
                    isDeleting={isDeleting}
                    onCancel={() => setPendingDelete(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
};
