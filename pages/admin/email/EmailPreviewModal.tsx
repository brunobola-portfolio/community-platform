import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { Monitor, Smartphone } from 'lucide-react';
import { Modal } from '../../../components/ui/UIComponents';
import { cn } from '../../../utils/cn';
import { api } from '../../../convex/_generated/api';

export interface PreviewDetail {
    label: string;
    value: string;
}

interface EmailPreviewModalProps {
    eyebrow: string;
    title: string;
    description?: string;
    /** undefined while loading. */
    html: string | undefined;
    details?: PreviewDetail[];
    onClose: () => void;
}

const WIDTHS = { desktop: 'w-full', phone: 'w-[375px] max-w-full' } as const;

/**
 * An email in a sandboxed frame (no scripts, no navigation), at desktop or
 * phone width, the two ways people read it.
 */
export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ eyebrow, title, description, html, details, onClose }) => {
    const [width, setWidth] = useState<keyof typeof WIDTHS>('desktop');
    return (
        <Modal isOpen onClose={onClose} size="lg" eyebrow={eyebrow} title={title} description={description}>
            <div className="space-y-4">
                {details && details.length > 0 && (
                    <dl className="grid grid-cols-2 gap-3 rounded-xl bg-black/20 p-3 sm:grid-cols-4">
                        {details.map(d => (
                            <div key={d.label} className="min-w-0">
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d.label}</dt>
                                <dd className="mt-0.5 truncate text-sm text-white" title={d.value}>{d.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}
                <div className="flex justify-end gap-1" role="group" aria-label="Largura da pré-visualização">
                    {([['desktop', Monitor, 'Computador'], ['phone', Smartphone, 'Telemóvel']] as const).map(([id, Icon, label]) => (
                        <button key={id} type="button" aria-pressed={width === id} onClick={() => setWidth(id)}
                            className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500',
                                width === id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white')}>
                            <Icon size={14} aria-hidden="true" /> {label}
                        </button>
                    ))}
                </div>
                <div className="flex justify-center rounded-xl bg-black/30 p-2">
                    {html === undefined
                        ? <div className="h-[60vh] w-full animate-pulse rounded-lg bg-white/5" />
                        : <iframe title={`Pré-visualização: ${title}`} sandbox="" srcDoc={html} className={cn('h-[60vh] rounded-lg border border-white/10 bg-white transition-[width]', WIDTHS[width])} />}
                </div>
            </div>
        </Modal>
    );
};

export type TemplateKind = 'registration_received' | 'registration_confirmed' | 'registration_cancelled' | 'board_registration' | 'board_contact' | 'contact_reply';

/** A template filled with a made-up person and the next event, to see before switching it on. */
export const TemplatePreviewModal: React.FC<{ kind: TemplateKind; label: string; onClose: () => void }> = ({ kind, label, onClose }) => {
    const preview = useQuery(api.email.previewTemplate, { kind });
    return (
        <EmailPreviewModal
            eyebrow={`Exemplo · ${label}`}
            title={preview?.subject ?? 'A preparar…'}
            description="Com dados de exemplo e a identidade do site. Nada é enviado."
            html={preview?.html}
            onClose={onClose}
        />
    );
};
