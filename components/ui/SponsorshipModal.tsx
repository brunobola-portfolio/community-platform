import React, { useState } from 'react';
import { Modal, Button, Badge } from './UIComponents';
import { CheckCircle2, ShieldCheck, Trophy, Sparkles, Send, Building2, ArrowLeft, ArrowRight, Star } from 'lucide-react';
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

    const getTierIcon = (id: string) => {
        switch (id) {
            case 'platinum': return Sparkles;
            case 'gold': return Trophy;
            case 'silver': return ShieldCheck;
            default: return Star;
        }
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

    return (
        <Modal isOpen={isOpen} onClose={reset} title="Torne-se Parceiro" size="xl">
            {/* Step 1: Choose Tier */}
            {step === 1 && (
                <div className="space-y-8 pb-4">
                    <div className="text-center relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <h3 className="text-3xl font-serif text-slate-900 dark:text-white mb-3 relative z-10">Invista na Comunidade</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-lg font-light relative z-10 leading-relaxed">
                            Ao apoiar a ARCVA, contribui diretamente para a cultura e desporto de Vale Alto. Escolha o seu nível de impacto.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 perspective-1000">
                        {sponsorTiers.map(tier => {
                            const Icon = getTierIcon(String(tier.id));
                            // Dynamically determine gradient based on mock data or fallback
                            const gradient = tier.color?.includes('from-') ? tier.color : 'from-brand-600 to-blue-600';

                            return (
                                <div
                                    key={tier.id}
                                    className="relative group bg-white dark:bg-dark-surface/40 border border-slate-900/10 dark:border-white/10 rounded-[2rem] p-1 overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform duration-500"
                                    onClick={() => handleSelectTier(String(tier.id))}
                                >
                                    {/* Glass Container */}
                                    <div className="relative h-full bg-slate-900/[0.03] dark:bg-black/20 backdrop-blur-xl rounded-[1.8rem] p-6 flex flex-col z-10">

                                        {/* Icon Header */}
                                        <div className="mb-6 flex justify-between items-start">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} p-[1px] shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                                <div className="w-full h-full bg-white dark:bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                                    <Icon className={`text-slate-800 dark:text-white`} size={24} />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-slate-900 dark:text-white">{tier.price}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Doação Anual</div>
                                            </div>
                                        </div>

                                        <h4 className={`text-xl font-serif font-bold text-slate-900 dark:text-white mb-6 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${gradient} transition-all`}>
                                            {tier.name}
                                        </h4>

                                        <ul className="space-y-3 mb-8 flex-1">
                                            {tier.benefits.map((b, i) => (
                                                <li key={i} className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                                    <CheckCircle2 size={14} className="text-brand-500 shrink-0 mt-0.5" />
                                                    <span className="leading-snug">{b}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button className="w-full text-xs bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 border border-slate-900/10 dark:border-white/10 text-slate-700 dark:text-white group-hover:border-brand-500/30 group-hover:text-slate-900 dark:group-hover:text-white transition-all rounded-xl">
                                            Selecionar <ArrowRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>

                                    {/* Hover Glow Background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="text-center pt-8 border-t border-slate-900/5 dark:border-white/5">
                        <p className="text-xs text-slate-500 mb-3">Tem uma proposta diferente ou donativo pontual?</p>
                        <Button variant="link" onClick={() => handleSelectTier('custom')} className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">Falar diretamente com a Direção</Button>
                    </div>
                </div>
            )}

            {/* Step 2: Form */}
            {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-8 max-w-md mx-auto py-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-[0_0_30px_rgba(223,61,50,0.4)]">
                            <Building2 size={32} />
                        </div>
                        <h3 className="text-2xl font-serif text-slate-900 dark:text-white mb-2">Formalizar Apoio</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Preencha os dados para iniciarmos esta parceria.</p>
                    </div>

                    <div className="space-y-5 bg-slate-900/5 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-900/10 dark:border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none"></div>

                        <FormInput
                            label="Nome / Empresa"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Nome da Entidade"
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

                        <div className="bg-white dark:bg-black/40 p-4 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex justify-between items-center border border-slate-900/5 dark:border-white/5 mt-2">
                            <span>Nível Selecionado:</span>
                            <Badge className="bg-brand-500/20 text-brand-600 dark:text-brand-400 border-none px-3 py-1 text-xs font-bold shadow-lg">{(sponsorTiers.find(t => String(t.id) === selectedTier)?.name || selectedTier || '').toUpperCase()}</Badge>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl text-center">
                            Erro ao enviar pedido. Tente novamente.
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1 hover:bg-slate-900/5 dark:hover:bg-white/5 rounded-xl"><ArrowLeft size={16} className="mr-2" /> Voltar</Button>
                        <Button type="submit" disabled={submitting} className="flex-1 bg-brand-600 hover:bg-brand-500 shadow-[0_0_20px_rgba(223,61,50,0.3)] border-none rounded-xl">{submitting ? 'A enviar…' : 'Confirmar'} <Send size={16} className="ml-2" /></Button>
                    </div>
                </form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <div className="text-center py-16 space-y-8 animate-fade-in-up">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 bg-green-500/30 rounded-full animate-ping"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-700 rounded-full flex items-center justify-center text-white shadow-2xl border border-white/20">
                            <CheckCircle2 size={48} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-serif text-slate-900 dark:text-white mb-4">Obrigado pelo Apoio!</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-lg font-light leading-relaxed">
                            O seu pedido foi registado com sucesso. A direção da ARCVA entrará em contacto brevemente para formalizar a parceria.
                        </p>
                    </div>
                    <Button onClick={reset} variant="outline" className="border-slate-900/20 dark:border-white/20 hover:bg-slate-900/10 dark:hover:bg-white/10 px-8 rounded-full">Voltar ao Site</Button>
                </div>
            )}
        </Modal>
    );
};