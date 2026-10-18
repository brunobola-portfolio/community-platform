import React, { useId, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, Server } from 'lucide-react';
import { STD_INPUT_CLASS, LABEL_CLASS } from '../constants';
import { cn } from '../../../utils/cn';

interface SecretFieldProps {
    label: string;
    /** Something is stored for this key. */
    stored: boolean;
    /** The deployment has its own value, used while this one is empty. */
    fromServer?: boolean;
    /** undefined = untouched, '' = remove, text = new value. */
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    placeholder?: string;
    hint?: React.ReactNode;
}

/**
 * Keys are write-only: the backoffice never shows a stored one again. It says
 * that one is there, and lets the board replace or remove it.
 */
export const SecretField: React.FC<SecretFieldProps> = ({ label, stored, fromServer, value, onChange, placeholder, hint }) => {
    const id = useId();
    const [visible, setVisible] = useState(false);
    // ' ' is "replacing, nothing typed yet": saving it keeps the stored key
    const editing = value !== undefined && value !== '';
    const removing = value === '';
    const showStored = stored && value === undefined;

    return (
        <div>
            <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
            {showStored ? (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <span className="flex items-center gap-2 text-sm text-emerald-300"><Check size={16} aria-hidden="true" /> Guardada</span>
                    <span className="font-mono text-xs tracking-widest text-slate-500" aria-hidden="true">••••••••••••</span>
                    <div className="ml-auto flex gap-1">
                        <button type="button" onClick={() => onChange('')} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-white/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500">Remover</button>
                        <button type="button" onClick={() => onChange(' ')} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-300 hover:bg-white/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500">Substituir</button>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <KeyRound size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        id={id}
                        type={visible ? 'text' : 'password'}
                        autoComplete="off"
                        spellCheck={false}
                        value={editing ? value.trimStart() : ''}
                        onChange={e => onChange(e.target.value === '' ? (stored ? ' ' : undefined) : e.target.value)}
                        placeholder={removing ? 'Vai ser removida ao guardar' : placeholder}
                        className={cn(STD_INPUT_CLASS, 'pl-9 pr-11 font-mono')}
                    />
                    <button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Esconder' : 'Mostrar'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-slate-400 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500">
                        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            )}
            {(removing || (editing && stored)) && (
                <button type="button" onClick={() => onChange(undefined)} className="mt-1 text-xs font-semibold text-slate-400 underline-offset-2 hover:text-white hover:underline">
                    {removing ? 'Afinal, manter a chave guardada' : 'Cancelar e manter a chave guardada'}
                </button>
            )}
            {fromServer && !stored && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-sky-300"><Server size={12} aria-hidden="true" /> Definida no servidor: só preencha para a substituir.</p>
            )}
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
    );
};
