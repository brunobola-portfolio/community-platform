import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '../../../convex/_generated/api';
import type { EmailProviderId, SmtpSecurity } from '../../../convex/lib/email/providers';

export type SecretKey = 'resendApiKey' | 'brevoApiKey' | 'postmarkToken' | 'graphClientSecret' | 'smtpPassword';

export interface EmailForm {
    provider: EmailProviderId;
    fromName: string;
    fromAddress: string;
    replyTo: string;
    boardAddress: string;
    notifyParticipants: boolean;
    notifyBoard: boolean;
    smtpHost: string;
    smtpPort: string;
    smtpSecurity: SmtpSecurity;
    smtpUser: string;
    graphTenantId: string;
    graphClientId: string;
    /** undefined = keep what is stored, '' = remove it, text = replace it. */
    secrets: Partial<Record<SecretKey, string>>;
}

export type EmailAdmin = NonNullable<ReturnType<typeof useQuery<typeof api.email.getAdmin>>>;

const TEXT_FIELDS = ['fromName', 'fromAddress', 'replyTo', 'boardAddress', 'smtpHost', 'smtpPort', 'smtpUser', 'graphTenantId', 'graphClientId'] as const;

function toForm(data: EmailAdmin): EmailForm {
    return {
        provider: data.provider,
        fromName: data.fromName ?? '',
        fromAddress: data.fromAddress ?? '',
        replyTo: data.replyTo ?? '',
        boardAddress: data.boardAddress ?? '',
        notifyParticipants: data.notifyParticipants ?? true,
        notifyBoard: data.notifyBoard ?? true,
        smtpHost: data.smtpHost ?? '',
        smtpPort: data.smtpPort ? String(data.smtpPort) : '',
        smtpSecurity: data.smtpSecurity ?? 'ssl',
        smtpUser: data.smtpUser ?? '',
        graphTenantId: data.graphTenantId ?? '',
        graphClientId: data.graphClientId ?? '',
        secrets: {},
    };
}

/** The form as the server would store it: trimmed text, and a "replace" opened with nothing typed counts as untouched. */
function normalised(form: EmailForm): string {
    const text = Object.fromEntries(TEXT_FIELDS.map(k => [k, (form[k] ?? '').trim()]));
    const secrets = Object.fromEntries(Object.entries(form.secrets).filter(([, v]) => v !== undefined && (v === '' || v.trim() !== '')));
    return JSON.stringify({ ...form, ...text, secrets });
}

/**
 * The Email tab edits its own table, so it keeps its own form instead of the
 * shared settings form. After a save it reloads from the subscription, so what
 * the page shows is what the server kept.
 */
export function useEmailSettingsForm() {
    const data = useQuery(api.email.getAdmin);
    const save = useMutation(api.email.update);
    const [form, setForm] = useState<EmailForm | null>(null);
    const [saving, setSaving] = useState(false);
    const resyncAfterSave = useRef(false);

    const saved = useMemo(() => (data ? toForm(data) : null), [data]);
    useEffect(() => {
        if (!saved) return;
        // First load, or the fresh values after a save; never over edits in progress
        if (!form || resyncAfterSave.current) {
            resyncAfterSave.current = false;
            setForm(saved);
        }
    }, [saved, form]);

    const dirty = Boolean(form && saved && normalised(form) !== normalised(saved));

    const update = useCallback(<K extends keyof EmailForm>(key: K, value: EmailForm[K]) => {
        setForm(current => (current ? { ...current, [key]: value } : current));
    }, []);

    const setSecret = useCallback((key: SecretKey, value: string | undefined) => {
        setForm(current => (current ? { ...current, secrets: { ...current.secrets, [key]: value } } : current));
    }, []);

    const submit = useCallback(async (): Promise<string | null> => {
        if (!form) return null;
        const portText = (form.smtpPort ?? '').trim();
        const port = portText ? Number(portText) : 0;
        if (!Number.isInteger(port)) return 'A porta SMTP tem de ser um número.';
        setSaving(true);
        try {
            // '' removes a key; ' ' means "replace" was opened but nothing typed, which keeps it
            const secrets = Object.fromEntries(Object.entries(form.secrets)
                .filter(([, v]) => v !== undefined && (v === '' || v.trim() !== ''))
                .map(([k, v]) => [k, (v as string).trim()]));
            const text = Object.fromEntries(TEXT_FIELDS.filter(k => k !== 'smtpPort').map(k => [k, (form[k] ?? '').trim()]));
            await save({
                ...text,
                provider: form.provider, notifyParticipants: form.notifyParticipants, notifyBoard: form.notifyBoard,
                smtpSecurity: form.smtpSecurity,
                // 0 clears the port back to the default for the security mode
                smtpPort: port,
                ...secrets,
            });
            resyncAfterSave.current = true;
            return null;
        } catch (e) {
            return e instanceof ConvexError && typeof e.data === 'string' ? e.data : 'Não foi possível guardar. Tente de novo.';
        } finally {
            setSaving(false);
        }
    }, [form, save]);

    return { data, form, dirty, saving, update, setSecret, submit, discard: () => setForm(saved) };
}
