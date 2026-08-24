
import React, { useState, useRef } from 'react';
import { Bold, Italic, Heading, List, Type, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../../../components/ui/UIComponents';
import { sanitizeHtml } from '../../../utils/security';
import { LABEL_CLASS } from '../constants';

export interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
    onEnhance?: () => void;
    isEnhancing?: boolean;
    label: string;
    height?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    onEnhance,
    isEnhancing,
    label,
    height = "h-64"
}) => {
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertTag = (tag: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);
        let newText = '';
        let newCursorPos = end;
        switch (tag) {
            case 'bold':   newText = `${before}<b>${selected}</b>${after}`;               newCursorPos = end + 7;  break;
            case 'italic': newText = `${before}<i>${selected}</i>${after}`;               newCursorPos = end + 7;  break;
            case 'h3':     newText = `${before}<h3>${selected}</h3>${after}`;             newCursorPos = end + 9;  break;
            case 'ul':     newText = `${before}<ul>\n  <li>${selected}</li>\n</ul>${after}`; newCursorPos = end + 19; break;
            case 'p':      newText = `${before}<p>${selected}</p>${after}`;               newCursorPos = end + 7;  break;
        }
        onChange(newText);
        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newCursorPos, newCursorPos); }, 0);
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label className={LABEL_CLASS}>{label}</label>
                <div className="flex items-center gap-2">
                    {onEnhance && (
                        <button
                            type="button"
                            onClick={onEnhance}
                            disabled={isEnhancing || !value}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-md text-xs font-bold shadow-lg hover:shadow-brand-500/20 transition-all disabled:opacity-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                            {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {isEnhancing ? 'A Melhorar...' : 'Melhorar'}
                        </button>
                    )}
                    <div className="flex bg-slate-900 rounded-lg p-0.5 border border-white/10">
                        <button type="button" onClick={() => setViewMode('edit')} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500", viewMode === 'edit' ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-white")}>Editor</button>
                        <button type="button" onClick={() => setViewMode('preview')} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500", viewMode === 'preview' ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-white")}>Visual</button>
                    </div>
                </div>
            </div>
            <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950/50 relative group focus-within:border-brand-500/50 transition-colors">
                {viewMode === 'edit' && (
                    <div className="flex gap-1 p-2 border-b border-slate-800 bg-slate-900/50 overflow-x-auto no-scrollbar touch-pan-x">
                        <button type="button" onClick={() => insertTag('bold')}   className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white whitespace-nowrap active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" title="Negrito"><Bold size={16} /></button>
                        <button type="button" onClick={() => insertTag('italic')} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white whitespace-nowrap active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" title="Itálico"><Italic size={16} /></button>
                        <button type="button" onClick={() => insertTag('h3')}     className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white whitespace-nowrap active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" title="Título"><Heading size={16} /></button>
                        <button type="button" onClick={() => insertTag('ul')}     className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white whitespace-nowrap active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" title="Lista"><List size={16} /></button>
                        <button type="button" onClick={() => insertTag('p')}      className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white whitespace-nowrap active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" title="Parágrafo"><Type size={16} /></button>
                    </div>
                )}
                {viewMode === 'edit' ? (
                    <textarea
                        ref={textareaRef}
                        className={cn("w-full bg-transparent border-none p-4 text-white font-mono text-sm outline-none resize-none custom-scrollbar leading-relaxed focus:ring-0", height)}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder="Escreva aqui o seu conteúdo ou use HTML..."
                    />
                ) : (
                    <div
                        className={cn("w-full bg-white/5 p-4 text-slate-300 prose prose-invert prose-sm max-w-none overflow-y-auto custom-scrollbar", height)}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) || '<p class="text-slate-500 italic">Sem conteúdo para pré-visualizar.</p>' }}
                    />
                )}
            </div>
        </div>
    );
};
