import React, { useEffect, useRef } from 'react';
import { Bold, Heading, Italic, Link2, List, ListOrdered, Pilcrow } from 'lucide-react';
import { cn } from '../../../components/ui/UIComponents';
import { sanitizeHtml } from '../../../utils/security';
import { plainTextToHtml } from '../../../utils/text';

interface VisualEditorProps {
    value: string;
    onChange: (html: string) => void;
    label: string;
    height: string;
}

type Command =
    | { kind: 'inline'; command: 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList' }
    | { kind: 'block'; tag: 'h3' | 'p' }
    | { kind: 'link' };

const TOOLS: { label: string; icon: React.ElementType; action: Command }[] = [
    { label: 'Negrito', icon: Bold, action: { kind: 'inline', command: 'bold' } },
    { label: 'Itálico', icon: Italic, action: { kind: 'inline', command: 'italic' } },
    { label: 'Subtítulo', icon: Heading, action: { kind: 'block', tag: 'h3' } },
    { label: 'Parágrafo', icon: Pilcrow, action: { kind: 'block', tag: 'p' } },
    { label: 'Lista', icon: List, action: { kind: 'inline', command: 'insertUnorderedList' } },
    { label: 'Lista numerada', icon: ListOrdered, action: { kind: 'inline', command: 'insertOrderedList' } },
    { label: 'Link', icon: Link2, action: { kind: 'link' } },
];

const TOOL_CLASS = 'rounded p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

/**
 * What the people who run an association need: type, press Enter for a new
 * paragraph, bold a word, paste from WhatsApp or Word. The HTML field this
 * replaces as the default showed tags, and text typed into it lost its line
 * breaks on the site because a newline is not a paragraph in HTML.
 *
 * execCommand is deprecated but implemented by every browser, and it is what
 * keeps this editor free of a 100 KB dependency.
 */
export const VisualEditor: React.FC<VisualEditorProps> = ({ value, onChange, label, height }) => {
    const ref = useRef<HTMLDivElement>(null);
    // The last HTML this editor emitted: writing it back would move the caret
    const emitted = useRef<string | null>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node || value === emitted.current) return;
        node.innerHTML = sanitizeHtml(value);
        emitted.current = value;
    }, [value]);

    const emit = () => {
        const node = ref.current;
        if (!node) return;
        // An emptied editor keeps a bare paragraph behind; that is no content
        const blank = !node.textContent?.trim() && !node.querySelector('img');
        const html = blank ? '' : node.innerHTML;
        emitted.current = html;
        onChange(html);
    };

    // Text typed into an empty box would sit outside any paragraph; starting
    // inside one keeps the first line styled like the rest
    const startParagraph = () => {
        const node = ref.current;
        document.execCommand('defaultParagraphSeparator', false, 'p');
        if (!node || node.textContent?.trim()) return;
        node.innerHTML = '<p><br></p>';
        const range = document.createRange();
        range.setStart(node.firstChild as Node, 0);
        range.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    };

    const run = (action: Command) => {
        ref.current?.focus();
        if (action.kind === 'inline') document.execCommand(action.command);
        if (action.kind === 'block') document.execCommand('formatBlock', false, action.tag);
        if (action.kind === 'link') {
            const url = window.prompt('Endereço do link (https://…)');
            if (!url) return;
            const safe = /^(https?:|mailto:|tel:)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
            document.execCommand('createLink', false, safe);
        }
        emit();
    };

    // Pasted text arrives clean: Word, Canva and WhatsApp bring fonts, colours
    // and spans that would fight the site's typography
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertHTML', false, plainTextToHtml(text));
        emit();
    };

    return (
        <>
            <div className="flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-900/50 p-2 no-scrollbar touch-pan-x" role="toolbar" aria-label={`Formatação: ${label}`}>
                {TOOLS.map(({ label: name, icon: Icon, action }) => (
                    <button
                        key={name}
                        type="button"
                        title={name}
                        aria-label={name}
                        // mousedown would move focus out of the text and lose the selection
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => run(action)}
                        className={TOOL_CLASS}
                    >
                        <Icon size={16} />
                    </button>
                ))}
            </div>
            <div
                ref={ref}
                role="textbox"
                aria-multiline="true"
                aria-label={label}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Escreva aqui. Enter cria um novo parágrafo."
                onFocus={startParagraph}
                onInput={emit}
                onBlur={() => {
                    // Leaving it untouched clears the starter paragraph, so the hint shows again
                    const node = ref.current;
                    if (node && !node.textContent?.trim() && !node.querySelector('img')) node.innerHTML = '';
                    emit();
                }}
                onPaste={handlePaste}
                className={cn(
                    'prose prose-invert prose-sm max-w-none w-full overflow-y-auto p-4 text-slate-200 outline-none custom-scrollbar',
                    'empty:before:pointer-events-none empty:before:text-slate-500 empty:before:content-[attr(data-placeholder)]',
                    height,
                )}
            />
        </>
    );
};
