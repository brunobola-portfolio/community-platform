import React, { useEffect, useRef } from 'react';
import { CalendarPlus, CheckCircle2, Mail, Phone } from 'lucide-react';
import { Button } from '../ui/UIComponents';
import { ShareBar } from '../ui/ShareBar';
import { canAddToCalendar, downloadIcs, googleCalendarUrl, type CalendarEvent } from '../../utils/calendar';
import { absoluteUrl, eventPath, eventShareText, formatEventDate } from '../../utils/share';
import type { Event } from '../../types';

interface RegistrationDoneProps {
    event: Event;
    email: string;
    contactEmail?: string;
    phone?: string;
}

/**
 * What happens next, stated plainly: the registration is received and waits
 * for the board, not "confirmed" (the old screen said so before anyone had
 * looked at it). Then the two things people do next: save the date, tell a
 * friend.
 */
export const RegistrationDone: React.FC<RegistrationDoneProps> = ({ event, email, contactEmail, phone }) => {
    const url = absoluteUrl(eventPath(event.slug));
    const calendar: CalendarEvent = { title: event.title, date: event.date, location: event.location, slug: event.slug, url, description: event.excerpt };
    const paid = Boolean(event.entryPrice && event.entryPrice > 0);
    const heading = useRef<HTMLHeadingElement>(null);

    // The send button that had focus is gone; land on the outcome instead
    useEffect(() => { heading.current?.focus(); }, []);

    return (
        <div className="space-y-6 py-2 text-center animate-fade-in-up">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={34} aria-hidden="true" />
            </div>
            <div className="space-y-2">
                <h3 ref={heading} tabIndex={-1} className="font-serif text-2xl text-slate-900 outline-none dark:text-white">Inscrição recebida</h3>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{event.title} · {formatEventDate(event.date)}{event.location ? ` · ${event.location}` : ''}</p>
                <p className="mx-auto max-w-sm text-sm text-slate-600 dark:text-slate-400">
                    A organização vai confirmar a sua inscrição e, se for preciso, contacta-o por <b className="text-slate-800 dark:text-slate-200">{email}</b>.
                </p>
            </div>

            {paid && (
                <div className="mx-auto max-w-sm space-y-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-left text-sm">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">Valor da inscrição: {event.entryPrice}€</p>
                    <p className="text-slate-700 dark:text-slate-300">O pagamento combina-se com a organização — no local ou pelos contactos abaixo.</p>
                    {phone && <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><Phone size={14} aria-hidden="true" /> <span className="font-mono">{phone}</span></p>}
                    {contactEmail && <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><Mail size={14} aria-hidden="true" /> <span className="break-all font-mono text-xs">{contactEmail}</span></p>}
                </div>
            )}

            {canAddToCalendar(calendar) && (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                <Button type="button" variant="outline" onClick={() => downloadIcs(calendar)}>
                    <CalendarPlus size={16} aria-hidden="true" /> Guardar no calendário
                </Button>
                <a href={googleCalendarUrl(calendar)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded dark:text-brand-400">
                    Google Calendar
                </a>
            </div>
            )}

            {(phone || contactEmail) && (
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <p>Não pode ir? Avise a organização:</p>
                    {phone && <p className="font-mono text-slate-800 dark:text-slate-200">{phone}</p>}
                    {contactEmail && <p className="font-mono text-slate-800 [overflow-wrap:anywhere] dark:text-slate-200">{contactEmail}</p>}
                </div>
            )}

            <div className="space-y-2 border-t border-slate-900/10 pt-5 dark:border-white/10">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Convide alguém</p>
                <ShareBar url={url} title={event.title} text={eventShareText(event)} className="justify-center" />
            </div>
        </div>
    );
};
