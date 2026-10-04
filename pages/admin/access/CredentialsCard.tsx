import React, { useState } from 'react';
import { Check, Copy, MessageSquareText, ShieldAlert } from 'lucide-react';
import { Button, cn } from '../../../components/ui/UIComponents';

interface CredentialsCardProps {
    email: string;
    password: string;
    name?: string;
    siteName: string;
}

/** Message the admin pastes into WhatsApp or email: everything the person needs to enter. */
export function welcomeMessage({ email, password, name, siteName }: CredentialsCardProps, origin: string): string {
    const hello = name ? `Olá ${name.split(' ')[0]}!` : 'Olá!';
    return [
        `${hello} Já tens acesso ao portal ${siteName}.`,
        '',
        `Entra em ${origin} (botão "Reservado" ou "Sócio") com:`,
        `Email: ${email}`,
        `Palavra-passe temporária: ${password}`,
        '',
        'Depois de entrares, muda a palavra-passe em "Alterar palavra-passe".',
    ].join('\n');
}

const CopyButton: React.FC<{ value: string; label: string; icon?: React.ReactNode }> = ({ value, label, icon }) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };
    return (
        <Button type="button" size="sm" variant="outline" onClick={copy} className="shrink-0" aria-label={label}>
            {copied ? <Check size={14} /> : icon ?? <Copy size={14} />} {copied ? 'Copiado' : label}
        </Button>
    );
};

/** Shown once after creating an account or resetting a password: the password is never shown again. */
export const CredentialsCard: React.FC<CredentialsCardProps> = props => {
    const message = welcomeMessage(props, window.location.origin);
    const row = 'flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3';
    return (
        <div className="space-y-3">
            <div className={row}>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                    <p className="truncate text-sm text-white">{props.email}</p>
                </div>
                <CopyButton value={props.email} label="Copiar" />
            </div>
            <div className={row}>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Palavra-passe temporária</p>
                    <p className="font-mono text-lg tracking-wider text-white">{props.password}</p>
                </div>
                <CopyButton value={props.password} label="Copiar" />
            </div>
            <div className={cn(row, 'items-start')}>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-300">{message}</p>
                <CopyButton value={message} label="Copiar mensagem" icon={<MessageSquareText size={14} />} />
            </div>
            <p className="flex items-start gap-2 text-xs text-amber-300">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                Esta palavra-passe só é mostrada agora. Envie-a por um canal privado.
            </p>
        </div>
    );
};
