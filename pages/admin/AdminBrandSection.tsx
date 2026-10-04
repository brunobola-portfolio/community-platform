import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Palette } from 'lucide-react';
import { cn } from '../../utils/cn';
import { DEFAULT_BRAND_COLOR, brandContrastReport, normalizeHex } from '../../utils/brandPalette';
import { BODY_FONTS, HEADING_FONTS } from '../../utils/brandFonts';
import { sanitizeExternalUrl } from '../../utils/security';
import { AdminSelect } from './components/AdminSelect';
import { BrandPreview } from './components/BrandPreview';
import { Field } from './components/Field';
import { LABEL_CLASS, STD_INPUT_CLASS } from './constants';
import type { Settings } from '../../types';

interface AdminBrandSectionProps {
    settingsForm: Settings;
    onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

// Literal classes so Tailwind's JIT sees them; the palette is generic, none of
// these is a client colour
const SWATCHES = [
    { hex: '#4f46e5', name: 'Índigo', className: 'bg-[#4f46e5]' },
    { hex: '#2563eb', name: 'Azul', className: 'bg-[#2563eb]' },
    { hex: '#0d9488', name: 'Verde-azulado', className: 'bg-[#0d9488]' },
    { hex: '#16a34a', name: 'Verde', className: 'bg-[#16a34a]' },
    { hex: '#d97706', name: 'Âmbar', className: 'bg-[#d97706]' },
    { hex: '#dc2626', name: 'Vermelho', className: 'bg-[#dc2626]' },
    { hex: '#db2777', name: 'Rosa', className: 'bg-[#db2777]' },
    { hex: '#7c3aed', name: 'Violeta', className: 'bg-[#7c3aed]' },
] as const;

const FULL_HEX = /^#?[0-9a-f]{6}$/i;

const formatRatio = (ratio: number): string => `${ratio.toFixed(1).replace('.', ',')}:1`;

interface ContrastRowProps {
    label: string;
    ratio: number;
    min: number;
}

const ContrastRow: React.FC<ContrastRowProps> = ({ label, ratio, min }) => {
    const ok = ratio >= min;
    return (
        <li className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-300">
                {ok ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" aria-hidden="true" /> : <AlertTriangle size={16} className="text-amber-400 shrink-0" aria-hidden="true" />}
                {label}
            </span>
            <span className={cn('font-mono text-xs', ok ? 'text-emerald-300' : 'text-amber-300')}>
                {formatRatio(ratio)} {ok ? 'AA' : `abaixo de ${formatRatio(min)}`}
            </span>
        </li>
    );
};

/**
 * Brand settings: one colour (the scale is derived and contrast-corrected),
 * heading/body fonts from a curated list and the link to the brand guide.
 */
export const AdminBrandSection: React.FC<AdminBrandSectionProps> = ({ settingsForm, onChange }) => {
    const color = normalizeHex(settingsForm.brandColor) ?? DEFAULT_BRAND_COLOR;
    // Holds an unfinished hex while the admin types; null shows the saved form value
    const [draft, setDraft] = useState<string | null>(null);
    const report = useMemo(() => brandContrastReport(color), [color]);
    const guideUrl = settingsForm.brandGuideUrl ?? '';
    const guideInvalid = guideUrl.trim() !== '' && sanitizeExternalUrl(guideUrl) === '';

    const setColor = (value: string) => {
        if (FULL_HEX.test(value.trim())) {
            onChange('brandColor', normalizeHex(value) ?? DEFAULT_BRAND_COLOR);
            setDraft(null);
        } else {
            setDraft(value);
        }
    };

    return (
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-serif text-white mb-2 flex items-center gap-2">
                <Palette className="text-brand-400" /> Marca
            </h3>
            <p className="text-sm text-slate-400 mb-6">
                Cor e tipografia do portal e do backoffice. A partir de uma cor geramos todos os tons, escurecidos quando é preciso para o texto continuar legível (contraste AA). Fica visível para todos depois de guardar.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                    <div>
                        <label htmlFor="brand-color-hex" className={LABEL_CLASS}>Cor da marca</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                aria-label="Escolher a cor da marca"
                                className="h-12 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-800 bg-slate-950/50 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            />
                            <input
                                id="brand-color-hex"
                                value={draft ?? color}
                                onChange={e => setColor(e.target.value)}
                                onBlur={() => setDraft(null)}
                                maxLength={7}
                                spellCheck={false}
                                aria-invalid={draft !== null}
                                aria-describedby="brand-color-hint"
                                className={cn(STD_INPUT_CLASS, 'font-mono uppercase')}
                                placeholder="#4F46E5"
                            />
                        </div>
                        <p id="brand-color-hint" className={cn('mt-1 text-xs', draft !== null ? 'text-amber-300' : 'text-slate-400')}>
                            {draft !== null ? 'Formato #rrggbb, por exemplo #4f46e5. Até ficar completo mantém-se a última cor válida.' : 'Hexadecimal #rrggbb, ou escolha no seletor.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Cores sugeridas">
                            {SWATCHES.map(s => (
                                <button
                                    key={s.hex}
                                    type="button"
                                    onClick={() => setColor(s.hex)}
                                    aria-label={`${s.name} (${s.hex})`}
                                    aria-pressed={color === s.hex}
                                    title={s.name}
                                    className={cn(
                                        'h-8 w-8 rounded-xl border border-white/20 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface',
                                        s.className,
                                        color === s.hex && 'ring-2 ring-white ring-offset-2 ring-offset-dark-surface'
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <p className={LABEL_CLASS}>Contraste</p>
                        <ul className="space-y-2">
                            <ContrastRow label="Texto branco nos botões" ratio={report.textOn700} min={4.5} />
                            <ContrastRow label="Títulos grandes na cor da marca" ratio={report.largeOn600} min={3} />
                            <ContrastRow label="Texto da marca no tema escuro" ratio={report.darkText400} min={4.5} />
                        </ul>
                        {report.adjusted && (
                            <p className="mt-3 text-xs text-amber-200/90">
                                A cor escolhida tem {formatRatio(report.baseOnWhite)} com o branco. Nos botões e textos o portal usa automaticamente um tom mais escuro da mesma cor.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Letra dos títulos">
                            <AdminSelect value={settingsForm.fontHeading ?? HEADING_FONTS[0].family} onChange={e => onChange('fontHeading', e.target.value)}>
                                {HEADING_FONTS.map(f => <option key={f.family} value={f.family}>{f.family}</option>)}
                            </AdminSelect>
                        </Field>
                        <Field label="Letra do texto">
                            <AdminSelect value={settingsForm.fontBody ?? BODY_FONTS[0].family} onChange={e => onChange('fontBody', e.target.value)}>
                                {BODY_FONTS.map(f => <option key={f.family} value={f.family}>{f.family}</option>)}
                            </AdminSelect>
                        </Field>
                    </div>

                    <Field
                        label="Guia de marca / media kit (link)"
                        hint={guideInvalid
                            ? 'Endereço inválido: use um caminho como /marca/ ou um link https://.'
                            : 'Logótipos, cores e contactos para imprensa e parceiros. Caminho interno (ex: /marca/, publicado pelo repositório da instância) ou link externo. Quando preenchido, aparece no rodapé como «Marca e imprensa».'}
                    >
                        <input
                            value={guideUrl}
                            maxLength={500}
                            onChange={e => onChange('brandGuideUrl', e.target.value)}
                            aria-invalid={guideInvalid}
                            className={STD_INPUT_CLASS}
                            placeholder="/marca/ ou https://..."
                        />
                    </Field>
                </div>

                <div>
                    <p className={LABEL_CLASS}>Pré-visualização</p>
                    <BrandPreview color={color} heading={settingsForm.fontHeading} body={settingsForm.fontBody} />
                </div>
            </div>
        </div>
    );
};
