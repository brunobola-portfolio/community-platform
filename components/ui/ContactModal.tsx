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

  const isMembership = initialSubject === 'Sócio';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isMembership ? 'Junte-se à Comunidade' : 'Fale Connosco'}
      eyebrow={isMembership ? 'Adesão' : 'Contacto'}
      description={
        isMembership
          ? 'Preencha os seus dados para iniciar o processo de inscrição como sócio.'
          : 'Dúvidas, sugestões ou parcerias? A direção responde a todas as mensagens.'
      }
      icon={isMembership ? <Sparkles size={20} /> : <MessageSquare size={20} />}
      footer={status === 'idle' || status === 'sending' ? (
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="contact-form" disabled={status === 'sending'} className="min-w-[150px]">
            {status === 'sending' ? <Loader2 className="animate-spin" size={18} /> : <><Send size={16} /> Enviar pedido</>}
          </Button>
        </div>
      ) : undefined}
    >
      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
          <div className="relative mb-6 h-20 w-20">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg ring-1 ring-white/20">
              <CheckCircle2 size={40} />
            </span>
          </div>
          <h3 className="mb-2 font-serif text-2xl text-slate-900 dark:text-white">Mensagem enviada</h3>
          <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            A direção recebeu o seu pedido e entrará em contacto brevemente.
          </p>
        </div>
      ) : status === 'error' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-600 ring-1 ring-red-500/20 dark:text-red-400">
            <X size={40} />
          </div>
          <h3 className="mb-2 font-serif text-2xl text-slate-900 dark:text-white">Não foi possível enviar</h3>
          <p className="mb-6 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Ocorreu um erro ao enviar a mensagem. Tente novamente dentro de momentos.
          </p>
          <Button onClick={() => setStatus('idle')} variant="outline">Tentar novamente</Button>
        </div>
      ) : (
        <form id="contact-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormInput
              label="Nome Completo"
              icon={User}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: João Santos"
              required
            />
            <FormInput
              label="Email de Contacto"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="exemplo@email.com"
              required
            />
          </div>

          <FormSelect
            label="Assunto"
            icon={Tag}
            value={formData.subject}
            onChange={e => setFormData({ ...formData, subject: e.target.value })}
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
            placeholder={isMembership ? 'Indique o seu contacto telefónico e morada...' : 'Descreva o motivo do seu contacto...'}
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            rows={5}
          />
        </form>
      )}
    </Modal>
  );
};
