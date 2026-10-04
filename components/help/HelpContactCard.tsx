import React from 'react';
import { LifeBuoy, Mail, MessageCircle } from 'lucide-react';
import { fillTokens } from '../../content/help';
import type { HelpContact } from './types';

interface HelpContactActionProps {
    contact: HelpContact;
    variant: 'button' | 'link';
}

interface HelpContactCardProps {
    contact: HelpContact;
    siteName: string;
}

const BUTTON = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg';
const LINK = 'inline-flex min-h-11 items-center gap-1.5 rounded font-semibold text-brand-700 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-400';

/** The contact as a button or an inline link; renders nothing when there is no way to reach anyone. */
export const HelpContactAction: React.FC<HelpContactActionProps> = ({ contact, variant }) => {
    const className = variant === 'button' ? BUTTON : LINK;
    const Icon = contact.href ? Mail : MessageCircle;
    const content = <>{variant === 'button' && <Icon size={16} aria-hidden="true" />}{contact.actionLabel}</>;
    if (contact.href) return <a href={contact.href} className={className}>{content}</a>;
    if (contact.onClick) return <button type="button" onClick={contact.onClick} className={className}>{content}</button>;
    return null;
};

/** "Não encontrou?" block shown with empty searches and unknown guide links. */
export const HelpContactCard: React.FC<HelpContactCardProps> = ({ contact, siteName }) => (
    <div role="group" aria-label={contact.title} className="flex flex-col gap-4 rounded-2xl border border-slate-900/10 bg-white p-5 dark:border-white/10 dark:bg-dark-surface sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
            <LifeBuoy size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-400" />
            <div className="space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">{contact.title}</p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{fillTokens(contact.text, { siteName })}</p>
            </div>
        </div>
        <div className="shrink-0"><HelpContactAction contact={contact} variant="button" /></div>
    </div>
);
