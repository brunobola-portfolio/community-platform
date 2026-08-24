import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, Loader2, MessageSquare, Mail, User, Tag, Sparkles } from 'lucide-react';
import { Modal, Button } from './UIComponents';
import { FormInput, FormTextarea, FormSelect } from './FormField';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, initialSubject = 'Geral' }) => {
  const submitContact = useMutation(api.contact.create);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: initialSubject,
    message: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setFormData(prev => ({ ...prev, subject: initialSubject }));
    }
  }, [isOpen, initialSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        return;
    }

    setStatus('sending');
    try {
        await submitContact({
            name: formData.name.trim(),
            email: formData.email.trim(),
            subject: formData.subject,
            message: formData.message.trim(),
        });
        setStatus('success');
        setTimeout(() => {
            onClose();
            setStatus('idle');
            setFormData({ name: '', email: '', subject: 'Geral', message: '' });
        }, 2000);
    } catch (error) {
        console.error('Contact submission error:', error);
        setStatus('error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialSubject === 'Sócio' ? 'Junte-se à Comunidade' : 'Fale Connosco'}>
      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
          <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
              <div className="relative w-24 h-24 bg-gradient-to-tr from-green-500 to-emerald-700 rounded-full flex items-center justify-center text-white shadow-2xl border border-white/20">
                  <CheckCircle2 size={48} />
              </div>
          </div>
          <h3 className="text-3xl font-serif text-slate-900 dark:text-white mb-2">Mensagem Enviada!</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-lg font-light">
             A direção da ARCVA recebeu o seu pedido e entrará em contacto brevemente.
          </p>
        </div>
      ) : status === 'error' ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <X size={48} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-serif text-slate-900 dark:text-white mb-2">Erro ao Enviar</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">Não foi possível enviar a mensagem. Tente novamente.</p>
            <Button onClick={() => setStatus('idle')} variant="outline">Tentar Novamente</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Header Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-100/60 via-slate-100/60 to-purple-100/60 dark:from-brand-900/40 dark:via-black/40 dark:to-purple-900/40 border border-slate-900/10 dark:border-white/10 p-6 rounded-2xl flex gap-4 items-center shadow-lg group">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl"></div>

             <div className="relative w-12 h-12 bg-slate-900/10 dark:bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-slate-900/10 dark:border-white/10 shadow-lg group-hover:scale-110 transition-transform">
                 {initialSubject === 'Sócio' ? <Sparkles className="text-brand-600 dark:text-brand-300" size={24} /> : <MessageSquare className="text-brand-600 dark:text-brand-300" size={24} />}
             </div>
             <div className="relative">
                 <h4 className="text-slate-900 dark:text-white font-medium mb-1 text-lg">
                    {initialSubject === 'Sócio' ? 'Torne-se Sócio' : 'Estamos à escuta'}
                 </h4>
                 <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                   {initialSubject === 'Sócio' 
                     ? 'Preencha os seus dados para iniciar o processo de inscrição.' 
                     : 'Dúvidas, sugestões ou parcerias? A nossa equipa está aqui.'}
                 </p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormInput
                label="Nome Completo"
                icon={User}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: João Santos"
                required
            />
            <FormInput
                label="Email de Contacto"
                icon={Mail}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="exemplo@email.com"
                required
            />
          </div>

          <FormSelect
            label="Assunto"
            icon={Tag}
            value={formData.subject}
            onChange={e => setFormData({...formData, subject: e.target.value})}
            options={[
              { value: 'Geral', label: 'Informação Geral' },
              { value: 'Direção', label: 'Contactar Direção' },
              { value: 'Sócio', label: 'Quero ser Sócio' },
              { value: 'Aluguer', label: 'Aluguer de Espaços' },
              { value: 'Eventos', label: 'Sugestão de Eventos' },
            ]}
          />

          <FormTextarea
            label="Mensagem"
            required
            placeholder={initialSubject === 'Sócio' ? "Indique o seu contacto telefónico e morada..." : "Descreva o motivo do seu contacto..."}
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
            rows={5}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-900/5 dark:border-white/5">
             <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl">Cancelar</Button>
             <Button
                type="submit"
                disabled={status === 'sending'}
                className="min-w-[160px] bg-gradient-to-r from-brand-600 to-brand-500 hover:brightness-110 shadow-[0_0_20px_rgba(223,61,50,0.3)] border-none rounded-xl"
             >
               {status === 'sending' ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-2"/> Enviar Pedido</>}
             </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};