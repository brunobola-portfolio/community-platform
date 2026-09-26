import { useCallback, useState } from 'react';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { getSessionId } from '../utils/session';
import type { Event } from '../types';

/** Base fields every registration asks for, before the event's own. */
export interface RegistrationValues {
    name: string;
    email: string;
    phone: string;
    /** Values of the event's own fields, keyed by field id. */
    extra: Record<string, string>;
    /** Honeypot: hidden from people, filled by bots. */
    website: string;
}

export type RegistrationErrors = Partial<Record<'name' | 'email' | 'submit', string>> & Record<string, string | undefined>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyValues = (me?: { name?: string | null; email?: string | null } | null): RegistrationValues => ({
    name: me?.name ?? '',
    email: me?.email ?? '',
    phone: '',
    extra: {},
    website: '',
});

/** The message a person can act on, never a validator dump or a stack. */
function messageFor(error: unknown): string {
    if (error instanceof ConvexError && typeof error.data === 'string') return error.data;
    const text = error instanceof Error ? error.message : '';
    const match = text.match(/Uncaught ConvexError: ([^\n]+)/);
    if (match) return match[1].trim();
    if (/limite de pedidos/i.test(text)) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';
    return 'Não foi possível enviar a inscrição. Verifique a ligação e tente de novo.';
}

export function validateRegistration(values: RegistrationValues, event: Pick<Event, 'registrationFields'>): RegistrationErrors {
    const errors: RegistrationErrors = {};
    if (!values.name.trim()) errors.name = 'Escreva o seu nome.';
    if (!values.email.trim()) errors.email = 'Escreva o seu email.';
    else if (!EMAIL.test(values.email.trim())) errors.email = 'Este email não parece válido.';
    for (const field of event.registrationFields ?? []) {
        if (field.required && !(values.extra[field.id] ?? '').trim()) errors[field.id] = `Preencha “${field.label}”.`;
    }
    return errors;
}

/**
 * One registration flow for members and guests. A signed-in member registers
 * with the account's email; anyone else goes through the guest mutation, which
 * the event has to allow.
 */
export function useEventRegistration(event: Event | null, isAuthenticated: boolean, me?: { name?: string | null; email?: string | null } | null) {
    const createMember = useMutation(api.registrations.create);
    const createGuest = useMutation(api.registrations.createGuest);
    const [values, setValues] = useState<RegistrationValues>(() => emptyValues(me));
    const [errors, setErrors] = useState<RegistrationErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const isGuest = !isAuthenticated;
    const canRegister = Boolean(event && (isAuthenticated || event.allowGuestRegistration !== false));

    const reset = useCallback(() => {
        setValues(emptyValues(me));
        setErrors({});
        setDone(false);
    }, [me]);

    const update = useCallback(<K extends keyof RegistrationValues>(key: K, value: RegistrationValues[K]) => {
        setValues((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined, submit: undefined }));
    }, []);

    const updateExtra = useCallback((id: string, value: string) => {
        setValues((current) => ({ ...current, extra: { ...current.extra, [id]: value } }));
        setErrors((current) => ({ ...current, [id]: undefined, submit: undefined }));
    }, []);

    const submit = useCallback(async () => {
        if (!event || submitting) return;
        const found = validateRegistration(values, event);
        if (Object.values(found).some(Boolean)) {
            setErrors(found);
            // Take the person to the first problem, so a screen reader says what it is
            requestAnimationFrame(() => document.querySelector<HTMLElement>('#event-registration-form [aria-invalid="true"]')?.focus());
            return;
        }

        setSubmitting(true);
        const payload = {
            eventId: event.id as Id<'events'>,
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim() || undefined,
            customData: Object.keys(values.extra).length ? values.extra : undefined,
        };
        try {
            if (isGuest) {
                const result = await createGuest({ ...payload, privacyNotice: true, sessionId: getSessionId(), website: values.website || undefined });
                if (result.status === 'duplicate') {
                    setErrors({ submit: 'Já existe uma inscrição com este email neste evento. Para mudar alguma coisa, contacte a organização.' });
                    return;
                }
            } else {
                await createMember(payload);
            }
            setDone(true);
        } catch (error) {
            setErrors({ submit: messageFor(error) });
        } finally {
            setSubmitting(false);
        }
    }, [event, submitting, values, isGuest, createGuest, createMember]);

    return { values, errors, submitting, done, isGuest, canRegister, update, updateExtra, submit, reset };
}
