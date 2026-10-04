import React, { useState } from 'react';
import { cn } from '../../../utils/cn';
import { normalizeHex } from '../../../utils/color';
import { LABEL_CLASS, STD_INPUT_CLASS } from '../constants';

export interface BrandSwatch {
    hex: string;
    name: string;
    /** Literal class so Tailwind's JIT compiles it, e.g. `bg-[#4f46e5]`. */
    className: string;
}

interface BrandColorFieldProps {
    id: string;
    label: string;
    /** Colour shown in the picker; for an automatic field, the automatic colour. */
    value: string;
    onChange: (hex: string) => void;
    swatches: readonly BrandSwatch[];
    /** Present when the field may be left empty (automatic); renders the reset control. */
    auto?: { active: boolean; label: string; onReset: () => void };
    hint: string;
}

const FULL_HEX = /^#?[0-9a-f]{6}$/i;

/**
 * Colour picker + hex input + suggested swatches, shared by the brand and
 * accent colours. An unfinished hex stays local until it is complete, so the
 * live preview never flickers through invalid colours.
 */
export const BrandColorField: React.FC<BrandColorFieldProps> = ({ id, label, value, onChange, swatches, auto, hint }) => {
    const [draft, setDraft] = useState<string | null>(null);

    const setColor = (raw: string) => {
        const hex = FULL_HEX.test(raw.trim()) ? normalizeHex(raw) : null;
        if (hex) {
            onChange(hex);
            setDraft(null);
        } else {
            setDraft(raw);
        }
    };

    return (
        <div>
            <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
            <div className="flex gap-3">
                <input
                    type="color"
                    value={value}
                    onChange={e => setColor(e.target.value)}
                    aria-label={`Escolher: ${label.toLowerCase()}`}
                    className="h-12 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-800 bg-slate-950/50 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                <input
                    id={id}
                    value={draft ?? (auto?.active ? '' : value)}
                    onChange={e => setColor(e.target.value)}
                    onBlur={() => setDraft(null)}
                    maxLength={7}
                    spellCheck={false}
                    aria-invalid={draft !== null}
                    aria-describedby={`${id}-hint`}
                    className={cn(STD_INPUT_CLASS, 'font-mono uppercase')}
                    placeholder={auto?.active ? `${auto.label} (${value.toUpperCase()})` : '#4F46E5'}
                />
                {auto && !auto.active && (
                    <button
                        type="button"
                        onClick={() => { setDraft(null); auto.onReset(); }}
                        className="shrink-0 rounded-xl border border-white/10 px-3 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                        Automático
                    </button>
                )}
            </div>
            <p id={`${id}-hint`} className={cn('mt-1 text-xs', draft !== null ? 'text-amber-300' : 'text-slate-400')}>
                {draft !== null ? 'Formato #rrggbb, por exemplo #4f46e5. Até ficar completo mantém-se a última cor válida.' : hint}
            </p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Sugestões: ${label.toLowerCase()}`}>
                {swatches.map(s => (
                    <button
                        key={s.hex}
                        type="button"
                        onClick={() => setColor(s.hex)}
                        aria-label={`${s.name} (${s.hex})`}
                        aria-pressed={!auto?.active && value === s.hex}
                        title={s.name}
                        className={cn(
                            'h-8 w-8 rounded-xl border border-white/20 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface',
                            s.className,
                            !auto?.active && value === s.hex && 'ring-2 ring-white ring-offset-2 ring-offset-dark-surface'
                        )}
                    />
                ))}
            </div>
        </div>
    );
};
