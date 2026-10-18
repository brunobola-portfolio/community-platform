import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { CheckCircle2, Loader2, Mail, Reply, Settings2 } from 'lucide-react';
import { Button, Modal } from '../../../components/ui/UIComponents';
import { STD_INPUT_CLASS } from '../constants';
import { cn } from '../../../utils/cn';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';

interface ReplyModalProps {
    message: Doc<'contactSubmissions'>;
    onClose: () => void;
    /** Switches the backoffice to the Email tab when sending is not set up. */
    onOpenEmailSettings?: () => void;
}

const FORM_ID = 'contact-reply-form';

/**
 * Answers a message from the contact form by email, with the original quoted
 * underneath, and marks it as replied. Without email set up it says so and
 * offers the person's own mail program instead.
 */
export const ReplyModal: React.FC<ReplyModalProps> = ({ message, onClose, onOpenEmailSettings }) => {
    const config = useQuery(api.email.getAdmin);
    const reply = useMutation(api.email.replyToContact);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logId, setLogId] = useState<Id<'emailLogs'> | null>(null);
    const log = useQuery(api.email.getLog, logId ? { id: logId } : 'skip');

    const ready = config && config.provider !== 'none' && config.missing.length === 0;
    const mailto = `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`;

    const send = async () => {
        if (!text.trim()) { setError('Escreva a resposta.'); return; }
        setBusy(true);
        setError(null);
        try {
            setLogId(await reply({ id: message._id, message: text }));
        } catch (e) {
            setError(e instanceof ConvexError && typeof e.data === 'string' ? e.data : 'Não foi possível enviar a resposta.');
        } finally {
            setBusy(false);
        }
    };

    const sent = log?.status === 'sent';
    const failed = log && (log.status === 'failed' || log.status === 'skipped');
    const sending = Boolean(logId) && !sent && !failed;

    return (
        <Modal
            isOpen
            onClose={onClose}
            icon={<Reply size={20} />}
            eyebrow={`Para ${message.name} <${message.email}>`}
            title={`Re: ${message.subject}`}
            description={ready ? 'A resposta segue por email, com a mensagem original por baixo. As respostas da pessoa chegam ao email da Direção.' : undefined}
            size="lg"
            footer={sent ? (
                <div className="flex justify-end"><Button onClick={onClose}>Fechar</Button></div>
            ) : ready ? (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
                    <Button type="submit" form={FORM_ID} disabled={busy || sending} className="sm:min-w-[160px]">
                        {busy || sending ? <Loader2 size={16} className="animate-spin" /> : <><Mail size={16} /> Enviar resposta</>}
                    </Button>
                </div>
            ) : undefined}
        >
            {config === undefined ? <div className="h-40 animate-pulse rounded-xl bg-white/5" /> : sent ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center" aria-live="polite">
                    <CheckCircle2 size={40} className="text-emerald-400" aria-hidden="true" />
                    <p className="text-lg font-semibold text-white">Resposta enviada</p>
                    <p className="text-sm text-slate-400">A mensagem ficou marcada como respondida.</p>
                </div>
            ) : !ready ? (
                <div className="space-y-4">
                    <p className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-100">Para responder daqui, ligue primeiro o envio de emails no separador Email. Entretanto, pode responder pelo seu programa de email.</p>
                    <div className="flex flex-wrap gap-2">
                        {onOpenEmailSettings && <Button variant="outline" onClick={onOpenEmailSettings}><Settings2 size={16} /> Configurar o email</Button>}
                        <a href={mailto} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"><Mail size={16} /> Abrir no meu email</a>
                    </div>
                </div>
            ) : (
                <form id={FORM_ID} onSubmit={e => { e.preventDefault(); void send(); }} className="space-y-4">
                    <div>
                        <label htmlFor="contact-reply-text" className="sr-only">Resposta</label>
                        <textarea id="contact-reply-text" autoFocus rows={7} maxLength={5000} value={text} onChange={e => { setText(e.target.value); setError(null); }}
                            className={cn(STD_INPUT_CLASS, 'min-h-[160px] leading-relaxed')} placeholder={`Olá ${message.name.split(' ')[0]},\n\n`} />
                        <p className="mt-1 text-right text-xs tabular-nums text-slate-500">{text.length} / 5000</p>
                    </div>
                    <div className="rounded-xl border-l-2 border-white/20 bg-black/20 p-3">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Mensagem original</p>
                        <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-slate-300">{message.message}</p>
                    </div>
                    <div aria-live="polite">
                        {sending && <p className="flex items-center gap-2 text-sm text-sky-300"><Loader2 size={16} className="animate-spin" aria-hidden="true" /> A enviar…</p>}
                        {(error || failed) && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error ?? log?.error}</p>}
                    </div>
                </form>
            )}
        </Modal>
    );
};
