
/**
 * AI Chat Modal Component
 *
 * Docked assistant panel: conversation state, voice input and text-to-speech.
 * Turn rendering lives in components/ai/ChatMessage.tsx.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAction } from "convex/react";
import { useNavigate } from 'react-router-dom';
import { api } from "../convex/_generated/api";
import { X, Send, Sparkles, Trash2, Mic } from 'lucide-react';
import { playBase64Audio } from '../utils/audio';
import { sanitizeText } from '../utils/security';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import { ChatMessage, AssistantAvatar, type ChatMessageData, type GroundingChunk } from './ai/ChatMessage';
import { ConvexError } from 'convex/values';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Question handed off from another surface (hero search); auto-sent on open. */
  initialQuery?: string;
  /** Notifies the owner that initialQuery was sent, so it can clear the pending state. */
  onInitialQueryConsumed?: () => void;
}

const buildWelcomeMessage = (siteName: string): ChatMessageData => ({
  role: 'model',
  text: `Olá! Sou o assistente inteligente da ${siteName}. Posso ajudar-te com informações sobre eventos, equipa, história, localização e muito mais. O que gostarias de saber?`,
  suggestedActions: [
    { label: 'Próximos Eventos', action: `Quais são os próximos eventos da ${siteName}?` },
    { label: `Sobre a ${siteName}`, action: '/about' },
    { label: 'A nossa Equipa', action: '/team' },
    { label: 'Como chegar?', action: `Como posso chegar à sede da ${siteName}?` }
  ]
});

// Friendly copy for the stable ERR_* tokens thrown by convex/ai.ts actions.
// Unknown/missing tokens fall back to a generic retry message.
const AI_ERROR_MESSAGES: Record<string, string> = {
  ERR_QUOTA: 'O assistente atingiu o limite diário de utilização. Volta a tentar mais tarde — entretanto podes explorar os eventos e novidades.',
  ERR_RATE_LIMIT: 'Muitos pedidos seguidos. Aguarda um momento e tenta novamente.',
  ERR_UNAVAILABLE: 'O assistente está temporariamente indisponível. Tenta novamente dentro de momentos.',
  ERR_GENERIC: 'Não consegui responder agora. Tenta novamente ou explora os eventos e notícias do portal.',
};

const getAiErrorMessage = (error: unknown): string => {
  let token = '';
  if (error instanceof ConvexError) {
    token = String(error.data);
  } else if (error instanceof Error) {
    token = error.message.match(/ERR_[A-Z_]+/)?.[0] ?? '';
  }
  return AI_ERROR_MESSAGES[token] ?? 'Não foi possível obter resposta. Tenta novamente.';
};

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, initialQuery, onInitialQueryConsumed }) => {
  const chatAction = useAction(api.ai.chat);
  const ttsAction = useAction(api.ai.tts);
  const navigate = useNavigate();
  const { settings } = useData();
  const welcomeMessage = buildWelcomeMessage(settings.siteName);
  const [messages, setMessages] = useState<ChatMessageData[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isOpen]);

  // Focus the composer on desktop only; on touch it would raise the keyboard
  // over the conversation before the user has read anything.
  useEffect(() => {
    if (!isOpen) return;
    if (window.matchMedia('(min-width: 640px)').matches) inputRef.current?.focus();
  }, [isOpen]);

  const handleClearConversation = () => {
    setMessages([welcomeMessage]);
    setInputText('');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSend = async (textOverride?: string) => {
    const rawMsg = textOverride || inputText.trim();
    if (!rawMsg) return;
    const userMsg = sanitizeText(rawMsg).slice(0, 2000);
    if (!userMsg) return;

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsThinking(true);

    try {
      const lowerMsg = userMsg.toLowerCase();
      const useMaps = lowerMsg.includes('onde') || lowerMsg.includes('chegar') || lowerMsg.includes('local') || lowerMsg.includes('direções');

      // Filter out the welcome message from history sent to API
      const historyForApi = messages
        .filter((_, idx) => idx > 0)
        .slice(-6)
        .map(m => ({ role: m.role, text: m.text }));
      const result = await chatAction({ message: userMsg, useMapsTool: useMaps, history: historyForApi });

      const reply = result.text;
      const links = result.groundingChunks as GroundingChunk[] | undefined;
      const suggestedActions = result.suggestedActions;

      setMessages(prev => [...prev, { role: 'model', text: reply, links, suggestedActions }]);

    } catch (error) {
      // ConvexError carries the ERR_* token in `data`; plain Error messages
      // are redacted in production. Log once, never rethrow — the user gets
      // a friendly bubble instead of a broken chat.
      console.warn("AI Chat error:", error instanceof ConvexError ? error.data : error);

      setMessages(prev => [...prev, {
        role: 'model',
        text: getAiErrorMessage(error),
        isError: true,
        suggestedActions: [
          { label: 'Ver Eventos', action: '/events' },
          { label: `Sobre a ${settings.siteName}`, action: '/about' },
        ],
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const {
    isSupported: voiceSupported,
    isListening,
    interimTranscript,
    error: voiceError,
    toggle: toggleVoice,
    stop: stopVoice,
  } = useSpeechRecognition({
    onFinal: (transcript) => void handleSend(transcript),
  });

  // Auto-send a question handed off from another surface (e.g. hero search).
  // isThinking in the deps queues the send until any in-flight reply settles.
  useEffect(() => {
    if (!isOpen || !initialQuery || isThinking) return;
    onInitialQueryConsumed?.();
    void handleSend(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuery, isThinking]);

  // A modal dismissed mid-dictation must not keep the microphone open
  useEffect(() => {
    if (!isOpen) stopVoice();
  }, [isOpen, stopVoice]);

  // Escape closes the chat, matching the behavior of every other modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const speak = async (text: string, index: number) => {
    setIsSpeaking(index);
    try {
      const result = await ttsAction({ text });
      await playBase64Audio(result.audioBase64);
    } catch (e) {
      console.error("TTS Error:", e);
    } finally {
      setIsSpeaking(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:justify-end p-0 sm:p-5 lg:p-6 pointer-events-none">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none dark:bg-black/60 dark:sm:bg-transparent pointer-events-auto"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Assistente ${settings.siteName}`}
        className="relative pointer-events-auto flex w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_32px_80px_-24px_rgba(2,6,23,0.65)] ring-1 ring-slate-900/10 animate-fade-in-up sm:w-[420px] sm:rounded-[1.75rem] dark:bg-dark-surface dark:ring-white/10 h-[86dvh] sm:h-[min(640px,calc(100dvh-6rem))]"
      >
        <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-5 py-4">
          <span className="pointer-events-none absolute -right-8 -top-16 h-40 w-40 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Sparkles size={19} className="text-white" aria-hidden="true" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-brand-900" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-serif text-base font-bold leading-tight text-white">{`Assistente ${settings.siteName}`}</h2>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.18em] text-white/55">Ao serviço da comunidade</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <button
                onClick={handleClearConversation}
                aria-label="Limpar conversa"
                title="Limpar conversa"
                className="rounded-xl p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={onClose}
                aria-label="Fechar"
                title="Fechar"
                className="rounded-xl p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </header>

        <div
          className="custom-scrollbar flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-4 py-5 dark:from-dark-bg dark:to-dark-surface"
          aria-live="polite"
        >
          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              message={msg}
              isLast={idx === messages.length - 1}
              isSpeaking={isSpeaking === idx}
              speechBusy={isSpeaking !== null}
              onSpeak={() => speak(msg.text, idx)}
              onNavigate={handleNavigate}
              onAsk={(question) => void handleSend(question)}
            />
          ))}
          {isThinking && (
            <div className="flex gap-3">
              <AssistantAvatar />
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-4 py-4 shadow-sm ring-1 ring-slate-900/[0.06] dark:bg-white/[0.05] dark:ring-white/10">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:300ms]" />
                <span className="sr-only">A escrever resposta</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-slate-900/[0.06] bg-white px-4 pb-3 pt-3 dark:border-white/10 dark:bg-dark-surface">
          {voiceError && (
            <p className="mb-2 px-1 text-[11px] text-red-600 dark:text-red-400" role="alert">{voiceError}</p>
          )}
          <div className={cn(
            'flex items-center gap-1.5 rounded-2xl border bg-slate-900/[0.03] p-1.5 transition-all focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20 dark:bg-black/30',
            isListening ? 'border-red-500/50' : 'border-slate-900/10 dark:border-white/10',
          )}>
            <input
              ref={inputRef}
              aria-label="Mensagem para a IA"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              placeholder={isListening ? 'A ouvir... fala agora' : 'Onde fica a sede? Próximos eventos?'}
              value={isListening ? interimTranscript || inputText : inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isThinking}
              readOnly={isListening}
            />
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                disabled={isThinking}
                aria-label={isListening ? 'Parar de ouvir' : 'Perguntar por voz'}
                aria-pressed={isListening}
                title={isListening ? 'Parar de ouvir' : 'Perguntar por voz'}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  isListening
                    ? 'bg-red-500/15 text-red-500'
                    : 'text-slate-400 hover:bg-slate-900/5 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white',
                )}
              >
                <Mic size={17} className={isListening ? 'animate-pulse' : ''} />
              </button>
            )}
            <button
              onClick={() => handleSend()}
              disabled={isThinking || isListening || !inputText.trim()}
              aria-label="Enviar mensagem"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-[0_6px_16px_-8px_rgba(223,61,50,0.9)] transition-all hover:bg-brand-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
            Respostas geradas por IA — confirma datas e detalhes importantes.
          </p>
        </div>
      </section>
    </div>
  );
};
