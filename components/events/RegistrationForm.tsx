import React, { useEffect } from 'react';
import { Users } from 'lucide-react';
import { Input } from '../ui/UIComponents';
import type { RegistrationErrors, RegistrationValues } from '../../hooks/useEventRegistration';
import { duplicatesBaseField } from '../../convex/lib/registrationRules';
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
    onMemberChange: (index: number, value: string) => void;
    onSubmit: () => void;
}

const LABEL = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400';
const ERROR = 'mt-1.5 text-xs text-red-600 dark:text-red-400';
const TEXTAREA = 'min-h-[88px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white';

/** Fields a browser can autofill, by the type the board chose for them. */
const AUTOCOMPLETE: Record<string, string> = { email: 'email', phone: 'tel', tel: 'tel' };

const Required = () => <span aria-hidden="true" className="text-red-600 dark:text-red-400"> *</span>;

interface TeamFieldsProps {
    formId: string;
    teamSize: number;
    values: RegistrationValues;
    errors: RegistrationErrors;
    onChange: RegistrationFormProps['onChange'];
    onMemberChange: RegistrationFormProps['onMemberChange'];
}

/**
 * The person filling the form is player 1; the others are named here, because
 * the board draws the brackets from this list and a team of one name is no use.
 */
const TeamFields: React.FC<TeamFieldsProps> = ({ formId, teamSize, values, errors, onChange, onMemberChange }) => (
    <fieldset className="space-y-4 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4">
        <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-900 dark:text-white">
            <Users size={16} aria-hidden="true" className="text-brand-700 dark:text-brand-400" /> A sua equipa · {teamSize} jogadores
        </legend>
        <p className="text-xs text-slate-600 dark:text-slate-400">Você é o jogador 1 e o contacto da equipa. Basta uma inscrição por equipa.</p>
        <div>
            <label htmlFor={`${formId}-team`} className={LABEL}>Nome da equipa <span className="font-normal normal-case tracking-normal">(opcional)</span></label>
            <Input id={`${formId}-team`} maxLength={100} value={values.teamName} onChange={(e) => onChange('teamName', e.target.value)} placeholder="Ex.: Os Ases" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: teamSize - 1 }, (_, i) => {
                const key = `member-${i}`;
                return (
                    <div key={key}>
                        <label htmlFor={`${formId}-${key}`} className={LABEL}>Jogador {i + 2}<Required /></label>
                        <Input id={`${formId}-${key}`} maxLength={100} autoComplete="off" aria-required="true" value={values.teamMembers[i] ?? ''} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${formId}-${key}-error` : undefined} onChange={(e) => onMemberChange(i, e.target.value)} placeholder="Nome e apelido" />
                        {errors[key] && <p id={`${formId}-${key}-error`} className={ERROR}>{errors[key]}</p>}
                    </div>
                );
            })}
        </div>
    </fieldset>
);

/**
 * Name and email are always asked, then the event's own fields. Before, an
 * event with its own fields (a team name, say) dropped the base ones and then
 * refused the registration for lacking an email nobody could type.
 */
export const RegistrationForm: React.FC<RegistrationFormProps> = ({
    formId, event, values, errors, isGuest, lockedEmail, siteName, onChange, onExtraChange, onMemberChange, onSubmit,
}) => {
    const teamSize = event.teamSize ?? 1;
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
                    <label htmlFor={`${formId}-name`} className={LABEL}>{teamSize >= 2 ? 'O seu nome (jogador 1)' : 'Nome'}<Required /></label>
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

            {teamSize >= 2 && <TeamFields formId={formId} teamSize={teamSize} values={values} errors={errors} onChange={onChange} onMemberChange={onMemberChange} />}

            {(event.registrationFields ?? []).filter((field) => !duplicatesBaseField(field)).map((field) => (
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
