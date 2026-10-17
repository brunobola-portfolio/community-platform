import { describe, expect, it } from 'vitest';
import { isDeadlinePassed, isRegistrationOpen, placesLeftText, teamSummary } from '../utils/registrationState';
import { cleanAnswers, cleanTeam, duplicatesBaseField, normalizeRegistrationSettings } from '../convex/lib/registrationRules';

const now = new Date('2026-10-10T12:00:00');
const open = { date: '2026-10-20T15:00', registrationOpen: true };

describe('registration window', () => {
    it('closes at the deadline, not only when the event starts', () => {
        expect(isRegistrationOpen(open, now)).toBe(true);
        expect(isRegistrationOpen({ ...open, registrationDeadline: '2026-10-09T23:59' }, now)).toBe(false);
        expect(isRegistrationOpen({ ...open, registrationDeadline: '2026-10-18T23:59' }, now)).toBe(true);
        expect(isRegistrationOpen({ ...open, registrationOpen: false }, now)).toBe(false);
        expect(isRegistrationOpen({ ...open, date: '2026-10-01T15:00' }, now)).toBe(false);
    });

    it('reads a deadline without a time as the whole of that day', () => {
        expect(isDeadlinePassed('2026-10-10', now)).toBe(false);
        expect(isDeadlinePassed('2026-10-09', now)).toBe(true);
    });

    it('ignores an empty or unreadable deadline, like the server', () => {
        expect(isDeadlinePassed(undefined, now)).toBe(false);
        expect(isDeadlinePassed('', now)).toBe(false);
        expect(isDeadlinePassed('amanhã', now)).toBe(false);
    });
});

describe('places', () => {
    it('counts teams on a team event', () => {
        expect(placesLeftText({ ...open, teamSize: 2, maxParticipants: 10, currentParticipants: 7 })).toBe('Restam 3 equipas');
        expect(placesLeftText({ ...open, maxParticipants: 10, currentParticipants: 9 })).toBe('Resta 1 lugar');
        expect(placesLeftText({ ...open, maxParticipants: 4, currentParticipants: 6 })).toBe('Restam 0 lugares');
        expect(placesLeftText(open)).toBeNull();
    });

    it('names the team before its players', () => {
        expect(teamSummary({ name: 'Ana', teamMembers: ['Rui'], teamName: 'Os Ases' })).toBe('Os Ases · Ana, Rui');
        expect(teamSummary({ name: 'Ana', teamMembers: [' ', 'Rui'] })).toBe('Ana, Rui');
    });
});

describe('team rules on the server', () => {
    it('asks for every other player and drops extras', () => {
        expect(() => cleanTeam({ teamSize: 2 }, undefined, [])).toThrow(/parceiro/);
        expect(() => cleanTeam({ teamSize: 4 }, undefined, ['A', ''])).toThrow(/3 colegas/);
        expect(cleanTeam({ teamSize: 2 }, ' Os Ases ', ['Rui', 'Extra'])).toEqual({ teamName: 'Os Ases', teamMembers: ['Rui'] });
        expect(cleanTeam({}, 'x', ['y'])).toEqual({});
    });

    it('lets the board write down a team with names missing', () => {
        expect(cleanTeam({ teamSize: 3 }, undefined, [], true)).toEqual({ teamName: undefined, teamMembers: undefined });
    });

    it('clears team size and deadline with 1 and "", touching only what was sent', () => {
        expect(normalizeRegistrationSettings({ teamSize: 1, registrationDeadline: '' })).toEqual({ teamSize: undefined, registrationDeadline: undefined });
        expect(normalizeRegistrationSettings({})).toEqual({});
        expect(normalizeRegistrationSettings({ teamSize: 2 })).toEqual({ teamSize: 2 });
        expect(() => normalizeRegistrationSettings({ registrationDeadline: 'ontem' })).toThrow(/não é válida/);
        expect(() => normalizeRegistrationSettings({ teamSize: 50 })).toThrow(/20/);
    });
});

describe('legacy copies of the base fields', () => {
    it('recognises an event question that repeats name, email or phone', () => {
        expect(duplicatesBaseField({ id: 'f-nome', label: 'Nome completo' })).toBe(true);
        expect(duplicatesBaseField({ id: 'email', label: 'O seu email' })).toBe(true);
        expect(duplicatesBaseField({ id: 'x', label: 'Telemóvel' })).toBe(true);
        expect(duplicatesBaseField({ id: 'team', label: 'Nome da equipa' })).toBe(false);
    });

    it('does not require them on the server', () => {
        expect(cleanAnswers({ registrationFields: [{ id: 'email', label: 'Email', type: 'email', required: true }] }, undefined)).toBeUndefined();
    });
});
