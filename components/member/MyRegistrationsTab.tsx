import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { MyRegistrationCard } from '../events/MyRegistrationCard';
import { Badge } from '../ui/UIComponents';
import { eventPath, formatEventDate } from '../../utils/share';
import { isEventUpcoming } from '../../utils/eventTime';
import type { MyRegistration } from '../../hooks/useMyRegistrations';

interface MyRegistrationsTabProps {
    registrations: MyRegistration[] | undefined;
    onCancel: (id: string) => Promise<string | null>;
}

const PAST_LABEL: Record<MyRegistration['status'], string> = { pending: 'Não confirmada', confirmed: 'Participou', cancelled: 'Cancelada' };

const EventLine: React.FC<{ registration: MyRegistration }> = ({ registration }) => (
    <div className="min-w-0">
        <Link to={eventPath(registration.event.slug)} className="rounded font-serif text-lg text-slate-900 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-white dark:hover:text-brand-400">
            {registration.event.title}
        </Link>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" /> {formatEventDate(registration.event.date)}</span>
            {registration.event.location && <span className="flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" /> {registration.event.location}</span>}
        </div>
    </div>
);

/**
 * Where a member checks whether the board has confirmed them, and drops out
 * when they cannot go. There is no email service, so this page is the receipt.
 */
export const MyRegistrationsTab: React.FC<MyRegistrationsTabProps> = ({ registrations, onCancel }) => {
    if (registrations === undefined) {
        return <div className="h-32 animate-pulse rounded-2xl bg-slate-900/5 dark:bg-white/5" aria-label="A carregar inscrições" />;
    }
    const upcoming = registrations.filter(r => isEventUpcoming(r.event.date) && r.status !== 'cancelled').reverse();
    const history = registrations.filter(r => !upcoming.includes(r));

    if (registrations.length === 0) {
        return (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-900/10 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-dark-surface">
                <Ticket size={32} aria-hidden="true" className="mb-4 text-brand-600 dark:text-brand-400" />
                <h3 className="font-serif text-xl text-slate-900 dark:text-white">Ainda não se inscreveu em nenhum evento</h3>
                <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">Quando se inscrever com a sessão iniciada, a inscrição e o estado (por confirmar ou confirmada) aparecem aqui.</p>
                <Link to="/events" className="mt-6 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Ver a agenda</Link>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in-up">
            <section aria-labelledby="my-upcoming" className="space-y-4">
                <h3 id="my-upcoming" className="font-serif text-xl text-slate-900 dark:text-white">Próximos</h3>
                {upcoming.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-400">Sem inscrições em eventos futuros. <Link to="/events" className="font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-400">Ver a agenda</Link></p>}
                {upcoming.map(r => (
                    <article key={r.id} className="space-y-4 rounded-2xl border border-slate-900/10 bg-white p-5 dark:border-white/10 dark:bg-dark-surface">
                        <EventLine registration={r} />
                        <MyRegistrationCard registration={r} onCancel={onCancel} compact />
                    </article>
                ))}
            </section>
            {history.length > 0 && (
                <section aria-labelledby="my-history" className="space-y-3">
                    <h3 id="my-history" className="font-serif text-xl text-slate-900 dark:text-white">Histórico</h3>
                    <ul className="divide-y divide-slate-900/5 rounded-2xl border border-slate-900/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-dark-surface">
                        {history.map(r => (
                            <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <EventLine registration={r} />
                                <Badge className="w-fit shrink-0 border-slate-900/10 bg-slate-900/5 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                                    {r.status === 'cancelled' ? 'Cancelada' : PAST_LABEL[r.status]}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};
