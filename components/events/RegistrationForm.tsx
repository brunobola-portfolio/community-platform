import React, { useEffect } from 'react';
import { Input } from '../ui/UIComponents';
import type { RegistrationErrors, RegistrationValues } from '../../hooks/useEventRegistration';
import type { Event } from '../../types';

interface RegistrationFormProps {
    formId: string;
    event: Event;
    values: RegistrationValues;
    errors: RegistrationErrors;
    isGuest: boolean;
    /** Signed in: the email is the account's and cannot be changed here. */
    lockedEmail: boolean;
    siteName: string;
    onChange: <K extends keyof RegistrationValues>(key: K, value: RegistrationValues[K]) => void;
    onExtraChange: (id: string, value: string) => void;
    onSubmit: () => void;
}

const LABEL = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400';
const ERROR = 'mt-1.5 text-xs text-red-600 dark:text-red-400';
const TEXTAREA = 'min-h-[88px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white';

/** Fields a browser can autofill, by the type the board chose for them. */
const AUTOCOMPLETE: Record<string, string> = { email: 'email', phone: 'tel', tel: 'tel' };

const Required = () => <span aria-hidden="true" className="text-red-600 dark:text-red-400"> *</span>;

/**
 * Name and email are always asked, then the event's own fields. Before, an
 * event with its own fields (a team name, say) dropped the base ones and then
 * refused the registration for lacking an email nobody could type.
 */
export const RegistrationForm: React.FC<RegistrationFormProps> = ({
    formId, event, values, errors, isGuest, lockedEmail, siteName, onChange, onExtraChange, onSubmit,
}) => {
    const describe = (id: string) => (errors[id] ? `${formId}-${id}-error` : undefined);

    // Opening the form lands on its first field, not on the button that opened it
    useEffect(() => {
        document.getElementById(`${formId}-name`)?.focus();
    }, [formId]);

    return (
        <form
            id={formId}
            noValidate
            onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
            className="space-y-5 animate-fade-in-up"
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor={`${formId}-name`} className={LABEL}>Nome<Required /></label>
                    <Input id={`${formId}-name`} autoComplete="name" aria-required="true" value={values.name} aria-invalid={Boolean(errors.name)} aria-describedby={describe('name')} onChange={(e) => onChange('name', e.target.value)} placeholder="O seu nome" />
                    {errors.name && <p id={`${formId}-name-error`} className={ERROR}>{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor={`${formId}-email`} className={LABEL}>Email<Required /></label>
                    <Input id={`${formId}-email`} type="email" inputMode="email" autoComplete="email" aria-required="true" readOnly={lockedEmail} value={values.email} aria-invalid={Boolean(errors.email)} aria-describedby={describe('email')} onChange={(e) => onChange('email', e.target.value)} placeholder="email@exemplo.pt" />
                    {errors.email && <p id={`${formId}-email-error`} className={ERROR}>{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor={`${formId}-phone`} className={LABEL}>Telemóvel <span className="font-normal normal-case tracking-normal text-slate-600 dark:text-slate-400">(opcional)</span></label>
                    <Input id={`${formId}-phone`} type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="9xx xxx xxx" />
                </div>
            </div>

            {(event.registrationFields ?? []).map((field) => (
                <div key={field.id}>
                    <label htmlFor={`${formId}-f-${field.id}`} className={LABEL}>{field.label}{field.required && <Required />}</label>
                    {field.type === 'textarea' ? (
                        <textarea id={`${formId}-f-${field.id}`} aria-required={field.required || undefined} className={TEXTAREA} placeholder={field.placeholder} value={values.extra[field.id] ?? ''} aria-invalid={Boolean(errors[field.id])} aria-describedby={describe(field.id)} onChange={(e) => onExtraChange(field.id, e.target.value)} />
                    ) : (
                        <Input id={`${formId}-f-${field.id}`} aria-required={field.required || undefined} type={field.type === 'phone' ? 'tel' : field.type} autoComplete={AUTOCOMPLETE[field.type] ?? 'off'} placeholder={field.placeholder} value={values.extra[field.id] ?? ''} aria-invalid={Boolean(errors[field.id])} aria-describedby={describe(field.id)} onChange={(e) => onExtraChange(field.id, e.target.value)} />
                    )}
                    {errors[field.id] && <p id={`${formId}-${field.id}-error`} className={ERROR}>{errors[field.id]}</p>}
                </div>
            ))}

            {/* Invisible to people and to assistive technology; bots fill every field */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor={`${formId}-website`}>Website</label>
                <input id={`${formId}-website`} tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => onChange('website', e.target.value)} />
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {isGuest ? 'Não precisa de conta. ' : ''}A {siteName} usa estes dados só para gerir esta inscrição e contactá-lo sobre o evento. <a href="/privacidade" target="_blank" rel="noopener" className="font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-400">Como tratamos os dados</a>
            </p>

            {errors.submit && (
                <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{errors.submit}</div>
            )}
        </form>
    );
};
