import React, { useEffect, useState } from 'react';
import { Check, Facebook, Link2, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { facebookShareUrl, whatsappShareUrl } from '../../utils/share';

interface ShareBarProps {
    /** Absolute URL of the thing being shared. */
    url: string;
    /** Title for the native share sheet. */
    title: string;
    /** Message that travels with the link (WhatsApp and the native sheet). */
    text?: string;
    className?: string;
}

const PILL = 'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';
const NEUTRAL = 'border-slate-900/10 bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10';

/**
 * WhatsApp first: it is where an association's news actually travels. The
 * native share sheet is offered only where it exists (phones), because on a
 * desktop it opens an empty or OS-level dialog that reads as broken.
 */
export const ShareBar: React.FC<ShareBarProps> = ({ url, title, text = '', className }) => {
    const [copied, setCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    }, []);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 2500);
        return () => clearTimeout(timer);
    }, [copied]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
        } catch {
            // Clipboard is blocked outside secure contexts; the prompt still lets them copy
            window.prompt('Copie o link:', url);
        }
    };

    const nativeShare = async () => {
        try {
            await navigator.share({ title, text, url });
        } catch {
            // Dismissing the sheet rejects the promise; nothing to report
        }
    };

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)} role="group" aria-label="Partilhar">
            <a
                href={whatsappShareUrl(text, url)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(PILL, 'border-emerald-700/20 bg-emerald-700 text-white hover:bg-emerald-800')}
            >
                <MessageCircle size={16} aria-hidden="true" /> WhatsApp
            </a>
            <a
                href={facebookShareUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(PILL, NEUTRAL)}
            >
                <Facebook size={16} aria-hidden="true" /> Facebook
            </a>
            <button type="button" onClick={copyLink} className={cn(PILL, NEUTRAL)}>
                {copied
                    ? <><Check size={16} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Link copiado</>
                    : <><Link2 size={16} aria-hidden="true" /> Copiar link</>}
            </button>
            <span className="sr-only" role="status">{copied ? 'Link copiado' : ''}</span>
            {canNativeShare && (
                <button type="button" onClick={nativeShare} className={cn(PILL, NEUTRAL)}>
                    <Share2 size={16} aria-hidden="true" /> Mais
                </button>
            )}
        </div>
    );
};
