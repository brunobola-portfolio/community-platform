
/**
 * AI Chat Modal Component
 *
 * Provides a grounded chat interface using Google Maps and Search tools.
 * Extracted from App.tsx to support the router-based layout architecture.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAction } from "convex/react";
import { useNavigate } from 'react-router-dom';
import { api } from "../convex/_generated/api";
import { Bot, X, Send, Loader2, Volume2, Globe, MapPin, Trash2, Mic, CloudOff } from 'lucide-react';
import { playBase64Audio } from '../utils/audio';
import { sanitizeText } from '../utils/security';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import { ConvexError } from 'convex/values';

interface GroundingChunk {
  web?: { uri: string; title?: string };
  maps?: { uri: string };
}

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Question handed off from another surface (hero search); auto-sent on open. */
  initialQuery?: string;
  /** Notifies the owner that initialQuery was sent, so it can clear the pending state. */
  onInitialQueryConsumed?: () => void;
}

const buildWelcomeMessage = (siteName: string) => ({
  role: 'model' as const,
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
  ERR_UNAVAILABLE: 'O assistente está temporariamente indisponível.',
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
  const [messages, setMessages] = useState<{
    role: 'user' | 'model',
    text: string,
    links?: GroundingChunk[],
    suggestedActions?: Array<{ label: string, action: string }>,
    isError?: boolean,
  }[]>([welcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleClearConversation = () => {
    setMessages([welcomeMessage]);
    setInputText('');
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

  // Helper to render text with markdown-style links, bold, and lists
  const renderMessageText = (text: string) => {
    // Split into lines to handle lists
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
      const isNumbered = /^\d+\.\s/.test(trimmed);

      const content = isBullet ? trimmed.slice(2) : isNumbered ? trimmed.replace(/^\d+\.\s/, '') : line;

      // Parse inline formatting: links and bold
      const parseInline = (str: string): React.ReactNode[] => {
        // Match markdown links [text](url) and bold **text**
        const parts = str.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
          const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            const [, linkText, linkPath] = linkMatch;
            if (linkPath.startsWith('/')) {
              return (
                <button key={`${lineIdx}-${i}`} onClick={() => { navigate(linkPath); onClose(); }}
                  className="text-brand-600 dark:text-brand-400 underline hover:text-brand-500 dark:hover:text-brand-300 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  {linkText}
                </button>
              );
            }
            return (
              <a key={`${lineIdx}-${i}`} href={linkPath} target="_blank" rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 underline hover:text-brand-500 dark:hover:text-brand-300">
                {linkText}
              </a>
            );
          }
          const boldMatch = part.match(/^\*\*(.+)\*\*$/);
          if (boldMatch) {
            return <strong key={`${lineIdx}-${i}`}>{boldMatch[1]}</strong>;
          }
          return <span key={`${lineIdx}-${i}`}>{part}</span>;
        });
      };

      if (isBullet || isNumbered) {
        elements.push(
          <div key={`line-${lineIdx}`} className="flex gap-2 ml-2">
            <span className="text-brand-600 dark:text-brand-400 shrink-0">{isBullet ? '•' : trimmed.match(/^\d+/)?.[0] + '.'}</span>
            <span>{parseInline(content)}</span>
          </div>
        );
      } else if (trimmed === '') {
        elements.push(<br key={`line-${lineIdx}`} />);
      } else {
        elements.push(
          <span key={`line-${lineIdx}`}>
            {lineIdx > 0 && !isBullet && !isNumbered && lines[lineIdx - 1]?.trim() !== '' ? <br /> : null}
            {parseInline(content)}
          </span>
        );
      }
    });

    return <>{elements}</>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end p-4 pointer-events-none">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/50 sm:bg-transparent dark:sm:bg-transparent pointer-events-auto" onClick={onClose}></div>
      <div className="bg-white dark:bg-dark-surface border border-brand-500/30 w-full sm:w-[450px] h-[80vh] sm:h-[650px] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-fade-in-up">
        <div className="bg-brand-950/90 backdrop-blur-md p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg"><Bot className="text-white" size={20} /></div>
            <div>
              <h3 className="text-white font-serif font-bold text-lg">{`Assistente ${settings.siteName}`}</h3>
              <span className="text-[10px] text-brand-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Ao serviço da comunidade
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearConversation}
              aria-label="Limpar conversa"
              className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              title="Limpar Conversa"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} aria-label="Fechar" className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-gradient-to-b from-slate-50 to-white dark:from-dark-bg dark:to-dark-surface custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3 text-sm max-w-[90%] shadow-lg transition-all ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-[1.5rem] rounded-tr-none' : msg.isError ? 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-[1.5rem] rounded-tl-none' : 'bg-white border border-slate-900/10 text-slate-800 dark:bg-white/5 dark:border-white/10 dark:text-slate-200 rounded-[1.5rem] rounded-tl-none'}`}>
                {msg.isError && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-amber-600 dark:text-amber-400">
                    <CloudOff size={14} className="shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">Assistente indisponível</span>
                  </div>
                )}
                {msg.role === 'model' ? renderMessageText(msg.text) : msg.text}
                {msg.role === 'model' && !msg.isError && (
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-900/5 dark:border-white/5 pt-2">
                    <button onClick={() => speak(msg.text, idx)} disabled={isSpeaking !== null} aria-label="Ouvir resposta" className="p-1.5 hover:bg-slate-900/10 dark:hover:bg-white/10 rounded-lg text-brand-600 dark:text-brand-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                      <Volume2 size={14} className={isSpeaking === idx ? 'animate-pulse' : ''} />
                    </button>
                  </div>
                )}
              </div>
              {msg.links && msg.links.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.links.map((link: GroundingChunk, lIdx: number) => (
                    <a key={lIdx} href={link.web?.uri || link.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-900/5 dark:bg-black/40 px-2 py-1 rounded border border-slate-900/10 dark:border-white/10 text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:bg-brand-500/20">
                      {link.maps ? <MapPin size={10} /> : <Globe size={10} />} {link.web?.title || 'Ver Fonte'}
                    </a>
                  ))}
                </div>
              )}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && idx === messages.length - 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((sa, saIdx) => (
                    <button key={saIdx}
                      onClick={() => {
                        if (sa.action.startsWith('/')) { navigate(sa.action); onClose(); }
                        else { handleSend(sa.action); }
                      }}
                      className="text-xs bg-brand-600/10 dark:bg-brand-600/20 border border-brand-500/30 text-brand-600 dark:text-brand-300 px-3 py-1.5 rounded-full hover:bg-brand-600/20 dark:hover:bg-brand-600/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      {sa.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isThinking && <div className="flex gap-2 text-brand-600 dark:text-brand-400 text-xs animate-pulse"><Loader2 size={14} className="animate-spin" /> IA a processar...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-dark-surface border-t border-slate-900/10 dark:border-white/10">
          {voiceError && (
            <p className="mb-2 px-2 text-[11px] text-red-600 dark:text-red-400" role="alert">{voiceError}</p>
          )}
          <div className="relative flex items-center gap-2">
            <input
              aria-label="Mensagem para a IA"
              className={cn(
                'flex-1 bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 rounded-full py-4 px-6 text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500',
                isListening && 'border-red-500/40 placeholder:text-red-600/60 dark:placeholder:text-red-300/60',
              )}
              placeholder={isListening ? 'A ouvir... fala agora' : 'Onde fica a sede? / Notícias recentes...'}
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
                className={cn(
                  'p-4 rounded-full border transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  isListening
                    ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-400'
                    : 'bg-slate-900/5 dark:bg-black/40 border-slate-900/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-900/30 dark:hover:border-white/30',
                )}
              >
                <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
              </button>
            )}
            <button onClick={() => handleSend()} disabled={isThinking || isListening || !inputText.trim()} aria-label="Enviar mensagem" className="p-4 bg-brand-600 rounded-full text-white shadow-lg hover:bg-brand-500 transition-all active:scale-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg"><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
