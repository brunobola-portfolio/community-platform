/**
 * Chat Message
 *
 * Renders a single assistant/user turn of the AI assistant: bubble, grounding
 * sources, read-aloud action and follow-up suggestions. Kept apart from the
 * modal shell so AIModal stays focused on conversation state.
 */

import React from 'react';
import { ArrowUpRight, CloudOff, Globe, MapPin, Sparkles, Volume2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface GroundingChunk {
  web?: { uri: string; title?: string };
  maps?: { uri: string };
}

export interface ChatMessageData {
  role: 'user' | 'model';
  text: string;
  links?: GroundingChunk[];
  suggestedActions?: Array<{ label: string; action: string }>;
  isError?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
  /** Suggestions are only actionable on the last turn, to avoid stale branches. */
  isLast: boolean;
  isSpeaking: boolean;
  speechBusy: boolean;
  onSpeak: () => void;
  onNavigate: (path: string) => void;
  onAsk: (question: string) => void;
}

export const AssistantAvatar: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 ring-1 ring-brand-600/20 dark:bg-brand-500/15 dark:ring-brand-500/25',
      className,
    )}
  >
    <Sparkles size={15} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />
  </div>
);

/** Renders the light markdown subset the model is allowed to emit. */
const renderText = (text: string, onNavigate: (path: string) => void): React.ReactNode => {
  const lines = text.split('\n');

  const parseInline = (str: string, lineIdx: number): React.ReactNode[] => {
    const parts = str.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [, linkText, linkPath] = linkMatch;
        if (linkPath.startsWith('/')) {
          return (
            <button
              key={`${lineIdx}-${i}`}
              onClick={() => onNavigate(linkPath)}
              className="rounded font-medium text-brand-600 underline decoration-brand-500/40 underline-offset-2 transition-colors hover:decoration-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
            >
              {linkText}
            </button>
          );
        }
        return (
          <a
            key={`${lineIdx}-${i}`}
            href={linkPath}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-600 underline decoration-brand-500/40 underline-offset-2 hover:decoration-brand-500 dark:text-brand-300"
          >
            {linkText}
          </a>
        );
      }
      const boldMatch = part.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) return <strong key={`${lineIdx}-${i}`}>{boldMatch[1]}</strong>;
      return <span key={`${lineIdx}-${i}`}>{part}</span>;
    });
  };

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const isNumbered = /^\d+\.\s/.test(trimmed);
    const content = isBullet ? trimmed.slice(2) : isNumbered ? trimmed.replace(/^\d+\.\s/, '') : line;

    // Models occasionally answer with markdown headings; render them as a
    // lead-in line instead of leaking the hashes into the bubble
    if (heading) {
      return (
        <span key={lineIdx} className="block pt-1 font-semibold text-slate-900 first:pt-0 dark:text-white">
          {parseInline(heading[1], lineIdx)}
        </span>
      );
    }

    if (isBullet || isNumbered) {
      return (
        <span key={lineIdx} className="flex gap-2">
          <span className="shrink-0 text-brand-600 dark:text-brand-400">
            {isBullet ? '•' : `${trimmed.match(/^\d+/)?.[0]}.`}
          </span>
          <span>{parseInline(content, lineIdx)}</span>
        </span>
      );
    }
    if (trimmed === '') return <span key={lineIdx} className="block h-2" />;
    return <span key={lineIdx}>{parseInline(content, lineIdx)}</span>;
  });
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLast,
  isSpeaking,
  speechBusy,
  onSpeak,
  onNavigate,
  onAsk,
}) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end pl-8">
        <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_8px_20px_-10px_rgba(223,61,50,0.9)]">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 space-y-2">
        <div
          className={cn(
            'w-fit max-w-full rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-sm ring-1',
            message.isError
              ? 'bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-200'
              : 'bg-white text-slate-700 ring-slate-900/[0.06] dark:bg-white/[0.05] dark:text-slate-200 dark:ring-white/10',
          )}
        >
          {message.isError && (
            <span className="mb-1.5 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <CloudOff size={13} className="shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Assistente indisponível</span>
            </span>
          )}
          <span className="flex flex-col gap-0.5 [overflow-wrap:anywhere]">{renderText(message.text, onNavigate)}</span>
        </div>

        {!message.isError && (
          <button
            onClick={onSpeak}
            disabled={speechBusy}
            aria-label="Ouvir resposta"
            className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 transition-colors hover:text-brand-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:text-brand-400"
          >
            <Volume2 size={13} className={isSpeaking ? 'animate-pulse text-brand-500' : ''} />
            {isSpeaking ? 'A ler...' : 'Ouvir'}
          </button>
        )}

        {message.links && message.links.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.links.map((link, lIdx) => (
              <a
                key={lIdx}
                href={link.web?.uri || link.maps?.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex max-w-full items-center gap-1 rounded-lg bg-slate-900/5 px-2 py-1 text-[10px] text-slate-500 ring-1 ring-slate-900/5 transition-colors hover:text-brand-600 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10 dark:hover:text-brand-400"
              >
                {link.maps ? <MapPin size={10} /> : <Globe size={10} />}
                <span className="truncate">{link.web?.title || 'Ver fonte'}</span>
              </a>
            ))}
          </div>
        )}

        {isLast && message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.suggestedActions.map((sa, saIdx) => {
              const isRoute = sa.action.startsWith('/');
              return (
                <button
                  key={saIdx}
                  onClick={() => (isRoute ? onNavigate(sa.action) : onAsk(sa.action))}
                  className="group flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-900/10 transition-all hover:bg-brand-600/5 hover:text-brand-700 hover:ring-brand-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/10 dark:hover:bg-brand-500/10 dark:hover:text-brand-200"
                >
                  {sa.label}
                  {isRoute && (
                    <ArrowUpRight size={12} className="text-slate-400 transition-colors group-hover:text-brand-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
