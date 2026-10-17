import { isEventUpcoming } from './eventTime';
import { DEFAULT_TIMEZONE, parseDeadline } from '../convex/lib/time';
import type { Event, Registration } from '../types';

/**
 * What the agenda, the event dialog and the backoffice say about an event's
 * registrations. The server decides with the same rules (convex/lib/registrationRules.ts);
 * these only keep the buttons from offering what it would refuse.
 */

type RegistrationEvent = Pick<Event, 'date' | 'registrationOpen' | 'registrationDeadline' | 'teamSize' | 'maxParticipants' | 'currentParticipants'>;

/** False for no deadline or an unreadable one: the server ignores those too. */
export function isDeadlinePassed(deadline: string | undefined, now: Date = new Date()): boolean {
    if (!deadline) return false;
    // Read at the venue's clock, like the server: a phone in another zone must not
    // show the button open after the server has closed
    const at = parseDeadline(deadline);
    return !Number.isNaN(at) && at < now.getTime();
}

export function isRegistrationOpen(event: RegistrationEvent, now: Date = new Date()): boolean {
    return event.registrationOpen === true && isEventUpcoming(event.date, now) && !isDeadlinePassed(event.registrationDeadline, now);
}

export function isTeamEvent(event: Pick<Event, 'teamSize'>): boolean {
    return (event.teamSize ?? 1) >= 2;
}

/** Singular and plural of what a place is: a person, or a team. */
export function placeNoun(event: Pick<Event, 'teamSize'>): [string, string] {
    return isTeamEvent(event) ? ['equipa', 'equipas'] : ['lugar', 'lugares'];
}

export function placesLeft(event: RegistrationEvent): number | null {
    if (!event.maxParticipants) return null;
    return Math.max(0, event.maxParticipants - (event.currentParticipants ?? 0));
}

/** "Restam 3 equipas", "Resta 1 lugar". */
export function placesLeftText(event: RegistrationEvent): string | null {
    const left = placesLeft(event);
    if (left === null) return null;
    const [one, many] = placeNoun(event);
    return left === 1 ? `Resta 1 ${one}` : `Restam ${left} ${many}`;
}

/** "sáb., 10 out., 23:59"; empty for an unreadable date. */
export function formatDeadline(deadline: string): string {
    const at = parseDeadline(deadline);
    if (Number.isNaN(at)) return '';
    return new Date(at).toLocaleString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: DEFAULT_TIMEZONE });
}

/** Everyone in a team registration, the contact first. */
export function teamPlayers(registration: Pick<Registration, 'name' | 'teamMembers'>): string[] {
    return [registration.name ?? '', ...(registration.teamMembers ?? [])].map(n => n.trim()).filter(Boolean);
}

/** "Os Ases · Ana, Rui" or just "Ana, Rui" for a team without a name. */
export function teamSummary(registration: Pick<Registration, 'name' | 'teamName' | 'teamMembers'>): string {
    const players = teamPlayers(registration).join(', ');
    return registration.teamName ? `${registration.teamName} · ${players}` : players;
}
