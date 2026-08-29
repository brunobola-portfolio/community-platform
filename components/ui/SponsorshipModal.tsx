import React, { useState } from 'react';
import { Modal, Button, Badge } from './UIComponents';
import { CheckCircle2, ShieldCheck, Trophy, Sparkles, Send, Building2, Handshake, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { FormInput } from './FormField';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface SponsorshipModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SponsorshipModal: React.FC<SponsorshipModalProps> = ({ isOpen, onClose }) => {
    const { sponsorTiers } = useData();
    const submitSponsorship = useMutation(api.sponsorshipRequests.create);
    const [selectedTier, setSelectedTier] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [error, setError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Tier ids and names are instance data (pt or en), so match on both
    const getTierIcon = (tier: { id: unknown; name?: string }) => {
        const haystack = (String(tier.id) + ' ' + (tier.name || '')).toLowerCase();
        if (haystack.includes('platin') || haystack.includes('vision')) return Sparkles;
        if (haystack.includes('ouro') || haystack.includes('gold')) return Trophy;
        if (haystack.includes('prata') || haystack.includes('silver')) return ShieldCheck;
        if (haystack.includes('institu')) return Building2;
        return Star;
    };

    const handleSelectTier = (id: string) => {
        setSelectedTier(id);
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(false);

        if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
            return;
        }

        setSubmitting(true);
        try {
            await submitSponsorship({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                tier: sponsorTiers.find(t => String(t.id) === selectedTier)?.name || selectedTier || 'custom',
            });
            setStep(3);
        } catch (err) {
            console.error('Sponsorship submission error:', err);
            setError(true);
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => {
        setStep(1);
        setSelectedTier(null);
        setForm({ name: '', email: '', phone: '' });
        setError(false);
        onClose();
    }

    const tierName = sponsorTiers.find(t => String(t.id) === selectedTier)?.name || selectedTier || '';

    const stepMeta = {
        1: {
            eyebrow: 'Passo 1 de 3',
            title: 'Torne-se Parceiro',
            description: 'Apoiar a associação é investir na cultura e no desporto da comunidade. Escolha o nível de impacto.',
            icon: <Handshake size={20} />,
            size: 'xl' as const,
        },
        2: {
            eyebrow: 'Passo 2 de 3',
            title: 'Formalizar apoio',
            description: 'Preencha os dados de contacto para iniciarmos esta parceria.',
            icon: <Building2 size={20} />,
            size: 'md' as const,
        },
        3: {
            eyebrow: 'Pedido enviado',
            title: 'Obrigado pelo apoio',
            description: 'A direção entrará em contacto brevemente para formalizar a parceria.',
            icon: <CheckCircle2 size={20} />,
            size: 'md' as const,
        },
    }[step as 1 | 2 | 3];

    const footer = step === 1 ? (
        <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs text-slate-500">Tem uma proposta diferente ou donativo pontual?</p>
            <Button variant="link" onClick={() => handleSelectTier('custom')}>Falar diretamente com a direção</Button>
        </div>
    ) : step === 2 ? (
        <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft size={16} /> Voltar
            </Button>
            <Button type="submit" form="sponsorship-form" disabled={submitting} className="flex-1">
                {submitting ? 'A enviar…' : <>Confirmar <Send size={16} /></>}
            </Button>
        </div>
    ) : (
        <div className="flex justify-center">
            <Button variant="outline" onClick={reset}>Voltar ao site</Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={reset}
            title={stepMeta.title}
            eyebrow={stepMeta.eyebrow}
            description={stepMeta.description}
            icon={stepMeta.icon}
            size={stepMeta.size}
            footer={footer}
        >
            {/* Step 1: Choose Tier */}
            {step === 1 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {sponsorTiers.map(tier => {
                        const Icon = getTierIcon(tier);
                        const isPricedTier = /[0-9]/.test(String(tier.price || ''));
                        return (
                            <button
                                key={tier.id}
                                type="button"
                                onClick={() => handleSelectTier(String(tier.id))}
                                className="group flex flex-col rounded-2xl bg-slate-900/[0.03] p-5 text-left ring-1 ring-slate-900/10 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:ring-brand-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-white/[0.03] dark:ring-white/10 dark:hover:bg-white/[0.06]"
                            >
                                <div className="mb-5 flex items-start justify-between gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 ring-1 ring-brand-600/20 transition-transform group-hover:scale-105 dark:bg-brand-500/15 dark:text-brand-400 dark:ring-brand-500/25">
                                        <Icon size={20} />
                                    </span>
                                    <span className="text-right">
                                        <span className="block text-base font-bold text-slate-900 dark:text-white">{tier.price}</span>
                                        {isPricedTier && (
                                            <span className="block text-[10px] uppercase tracking-widest text-slate-400">Doação anual</span>
                                        )}
                                    </span>
                                </div>

                                <h4 className="mb-4 font-serif text-lg font-bold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                                    {tier.name}
                                </h4>

                                <ul className="mb-6 flex-1 space-y-2.5">
                                    {tier.benefits.map((b, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-xs leading-snug text-slate-600 dark:text-slate-300">
                                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-500" />
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>

                                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                                    Selecionar <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Step 2: Form */}
            {step === 2 && (
                <form id="sponsorship-form" onSubmit={handleSubmit} className="space-y-5">
                    <FormInput
                        label="Nome / Empresa"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nome da entidade"
                        required
                    />
                    <FormInput
                        label="Email de Contacto"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="email@empresa.com"
                        required
                    />
                    <FormInput
                        label="Telefone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+351 9xx xxx xxx"
                        required
                    />

                    <div className="flex items-center justify-between rounded-2xl bg-slate-900/[0.03] px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-900/5 dark:bg-white/[0.03] dark:text-slate-300 dark:ring-white/10">
                        <span>Nível selecionado</span>
                        <Badge className="border-brand-500/20 bg-brand-500/15 px-3 py-1 text-brand-700 dark:text-brand-400">
                            {tierName.toUpperCase()}
                        </Badge>
                    </div>

                    {error && (
                        <p className="rounded-xl bg-red-500/10 p-3 text-center text-sm text-red-600 ring-1 ring-red-500/20 dark:text-red-400" role="alert">
                            Erro ao enviar pedido. Tente novamente.
                        </p>
                    )}
                </form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <div className="flex flex-col items-center py-10 text-center animate-fade-in-up">
                    <div className="relative mb-6 h-20 w-20">
                        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg ring-1 ring-white/20">
                            <CheckCircle2 size={40} />
                        </span>
                    </div>
                    <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        O seu pedido foi registado com sucesso. Guardámos o nível <strong className="font-semibold text-slate-700 dark:text-slate-200">{tierName}</strong> e entramos em contacto pelo email indicado.
                    </p>
                </div>
            )}
        </Modal>
    );
};
