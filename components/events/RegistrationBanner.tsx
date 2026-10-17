import React from 'react';
import { CheckCircle2, Users, X } from 'lucide-react';
import { formatDeadline, isTeamEvent, placesLeftText } from '../../utils/registrationState';
import type { Event } from '../../types';

interface RegistrationBannerProps {
    event: Event;
    soldOut: boolean;
}

/**
 * The three facts a person needs before pressing "Register": is there room,
 * until when, and whether it is per person or per team.
 */
export const RegistrationBanner: React.FC<RegistrationBannerProps> = ({ event, soldOut }) => {
    if (soldOut) {
        return (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/5 p-4 ring-1 ring-slate-900/10 dark:bg-white/5 dark:ring-white/10">
                <X size={18} aria-hidden="true" className="shrink-0 text-slate-600 dark:text-slate-400" />
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Esgotado</div>
                    <div className="text-sm text-slate-700 dark:text-slate-200">Já não há vagas. Fale com a organização para ficar em lista de espera.</div>
                </div>
            </div>
        );
    }
    const places = placesLeftText(event);
    const deadline = event.registrationDeadline ? formatDeadline(event.registrationDeadline) : '';
    const facts = [
        places ? `${places}.` : 'Garanta o seu lugar.',
        deadline ? `Inscrições até ${deadline}.` : null,
    ].filter(Boolean).join(' ');
    return (
        <div className="space-y-3 rounded-2xl bg-brand-500/10 p-4 ring-1 ring-brand-500/20">
            <div className="flex items-start gap-3">
                <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-400" />
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">Inscrições abertas</div>
                    <div className="text-sm text-slate-700 dark:text-slate-200">{facts}</div>
                </div>
            </div>
            {isTeamEvent(event) && (
                <p className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <Users size={18} aria-hidden="true" className="shrink-0 text-brand-700 dark:text-brand-400" />
                    <span>Inscrição por equipa de {event.teamSize} jogadores: uma pessoa inscreve a equipa toda.</span>
                </p>
            )}
        </div>
    );
};
