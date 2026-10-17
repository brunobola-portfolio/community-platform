import { useCallback } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import type { RegistrationStatus } from '../types';

export interface MyRegistration {
    id: string;
    eventId: string;
    status: RegistrationStatus;
    timestamp: number;
    teamName?: string;
    teamMembers?: string[];
    event: { title: string; slug: string; date: string; location: string; entryPrice?: number };
}

/**
 * The signed-in member's registrations, for the "you are registered" state on
 * an event and the list in the member area. Visitors never subscribe.
 */
export function useMyRegistrations() {
    const { isAuthenticated } = useConvexAuth();
    const rows = useQuery(api.registrations.myRegistrations, isAuthenticated ? {} : 'skip');
    const cancelMutation = useMutation(api.registrations.cancelMine);

    const registrations: MyRegistration[] | undefined = rows?.map(r => ({ ...r, id: r._id, status: r.status as RegistrationStatus }));

    /** The active registration for one event: a cancelled one lets the member register again. */
    const forEvent = useCallback(
        (eventId: string | undefined) => registrations?.find(r => r.eventId === eventId && r.status !== 'cancelled'),
        [registrations],
    );

    const cancel = useCallback(async (id: string): Promise<string | null> => {
        try {
            await cancelMutation({ id: id as Id<'registrations'> });
            return null;
        } catch (error) {
            return error instanceof ConvexError && typeof error.data === 'string'
                ? error.data
                : 'Não foi possível cancelar. Tente de novo ou contacte a organização.';
        }
    }, [cancelMutation]);

    return { registrations, isLoading: isAuthenticated && rows === undefined, forEvent, cancel };
}
