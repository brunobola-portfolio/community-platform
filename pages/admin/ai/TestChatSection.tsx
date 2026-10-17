import React, { Suspense, lazy, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, EyeOff, MessageSquare, PowerOff } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';
import { ToastProvider } from '../../../context/ToastContext';
import { cn } from '../../../utils/cn';

const AIModal = lazy(() => import('../../../components/AIModal').then(m => ({ default: m.AIModal })));

interface TestChatSectionProps {
    /** What is saved, which is what the assistant answers with. */
    enabled: boolean;
    bubbleVisible: boolean;
    /** The form has chat settings that are not saved yet. */
    dirty: boolean;
}

const SUGGESTIONS = ['Quais são os próximos eventos?', 'Como me inscrevo num evento?', 'Onde fica a sede?'];

const Status: React.FC<{ tone: 'ok' | 'warn' | 'off'; icon: React.ElementType; children: React.ReactNode }> = ({ tone, icon: Icon, children }) => (
    <li className={cn('flex items-start gap-2 text-sm', tone === 'ok' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : 'text-slate-300')}>
        <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>{children}</span>
    </li>
);

/**
 * Opens the real assistant inside the backoffice. Before, the button looked for
 * the public site's floating bubble, which does not exist on /admin, and did
 * nothing. Admins can test with the chatbot switched off for visitors.
 */
export const TestChatSection: React.FC<TestChatSectionProps> = ({ enabled, bubbleVisible, dirty }) => {
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState<string | undefined>();

    const start = (q?: string) => { setQuestion(q); setOpen(true); };

    return (
        <section aria-labelledby="test-chat-title" className="rounded-2xl border border-white/10 bg-dark-surface p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-4">
                    <h3 id="test-chat-title" className="flex items-center gap-2 font-serif text-xl text-white">
                        <MessageSquare className="text-emerald-400" aria-hidden="true" /> Testar o assistente
                    </h3>
                    <p className="max-w-xl text-sm text-slate-400">Converse com o assistente tal como um visitante o vê, com os dados reais do site. Responde com as definições guardadas.</p>
                    <ul className="space-y-2">
                        {enabled
                            ? <Status tone="ok" icon={CheckCircle2}>Ligado no portal.</Status>
                            : <Status tone="off" icon={PowerOff}>Desligado no portal: só os administradores o podem testar aqui.</Status>}
                        {enabled && !bubbleVisible && <Status tone="off" icon={EyeOff}>Botão flutuante escondido: os visitantes não o veem no canto do ecrã.</Status>}
                        {dirty && <Status tone="warn" icon={AlertTriangle}>Há alterações por guardar. Guarde para o teste as usar.</Status>}
                    </ul>
                </div>
                <div className="flex shrink-0 flex-col gap-3 lg:w-72">
                    <Button onClick={() => start()} className="w-full whitespace-nowrap">
                        <Bot size={16} /> Abrir conversa de teste
                    </Button>
                    <div className="flex flex-wrap gap-2" aria-label="Perguntas de exemplo">
                        {SUGGESTIONS.map(q => (
                            <button key={q} type="button" onClick={() => start(q)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-brand-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {open && (
                <ToastProvider>
                    <Suspense fallback={null}>
                        <AIModal
                            isOpen
                            onClose={() => setOpen(false)}
                            initialQuery={question}
                            onInitialQueryConsumed={() => setQuestion(undefined)}
                            onNavigatePath={path => window.open(path, '_blank', 'noopener')}
                        />
                    </Suspense>
                </ToastProvider>
            )}
        </section>
    );
};
