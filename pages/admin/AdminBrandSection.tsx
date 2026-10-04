import React from 'react';
import { Palette } from 'lucide-react';
import { DEFAULT_BRAND_COLOR, normalizeHex } from '../../utils/brandPalette';
import { resolveAccentColor } from '../../utils/brandAccent';
import { BODY_FONTS, HEADING_FONTS, MONO_FONTS } from '../../utils/brandFonts';
import { sanitizeExternalUrl } from '../../utils/security';
import { AdminSelect } from './components/AdminSelect';
import { BrandColorField } from './components/BrandColorField';
import type { BrandSwatch } from './components/BrandColorField';
import { BrandContrastPanel } from './components/BrandContrastPanel';
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
const BRAND_SWATCHES: readonly BrandSwatch[] = [
    { hex: '#4f46e5', name: 'Índigo', className: 'bg-[#4f46e5]' },
    { hex: '#2563eb', name: 'Azul', className: 'bg-[#2563eb]' },
    { hex: '#0d9488', name: 'Verde-azulado', className: 'bg-[#0d9488]' },
    { hex: '#16a34a', name: 'Verde', className: 'bg-[#16a34a]' },
    { hex: '#d97706', name: 'Âmbar', className: 'bg-[#d97706]' },
    { hex: '#dc2626', name: 'Vermelho', className: 'bg-[#dc2626]' },
    { hex: '#db2777', name: 'Rosa', className: 'bg-[#db2777]' },
    { hex: '#7c3aed', name: 'Violeta', className: 'bg-[#7c3aed]' },
];

// Accents that pair with most brands: metallics and soft complements
const ACCENT_SWATCHES: readonly BrandSwatch[] = [
    { hex: '#fbbf24', name: 'Dourado', className: 'bg-[#fbbf24]' },
    { hex: '#f59e0b', name: 'Âmbar', className: 'bg-[#f59e0b]' },
    { hex: '#fb7185', name: 'Coral', className: 'bg-[#fb7185]' },
    { hex: '#2dd4bf', name: 'Turquesa', className: 'bg-[#2dd4bf]' },
    { hex: '#38bdf8', name: 'Céu', className: 'bg-[#38bdf8]' },
    { hex: '#a3e635', name: 'Lima', className: 'bg-[#a3e635]' },
    { hex: '#e5e7eb', name: 'Prata', className: 'bg-[#e5e7eb]' },
];

/**
 * Brand settings: primary and accent colours (the scales are derived and
 * contrast-corrected), heading/body/mono fonts from a curated list and the
 * link to the brand guide.
 */
export const AdminBrandSection: React.FC<AdminBrandSectionProps> = ({ settingsForm, onChange }) => {
    const color = normalizeHex(settingsForm.brandColor) ?? DEFAULT_BRAND_COLOR;
    const storedAccent = normalizeHex(settingsForm.accentColor) ?? '';
    const accent = resolveAccentColor(color, storedAccent);
    const guideUrl = settingsForm.brandGuideUrl ?? '';
    const guideInvalid = guideUrl.trim() !== '' && sanitizeExternalUrl(guideUrl) === '';

    return (
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-serif text-white mb-2 flex items-center gap-2">
                <Palette className="text-brand-400" /> Marca
            </h3>
            <p className="text-sm text-slate-400 mb-6">
                Cores e tipografia do portal e do backoffice, tal como no guia de marca. A partir de cada cor geramos todos os tons (e os cinzentos do site, com um toque da cor da marca), ajustados quando é preciso para o texto continuar legível (contraste AA). Fica visível para todos depois de guardar.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                    <BrandColorField
                        id="brand-color-hex"
                        label="Cor da marca"
                        value={color}
                        onChange={hex => onChange('brandColor', hex)}
                        swatches={BRAND_SWATCHES}
                        hint="A cor principal do guia de marca: botões, ligações e títulos. Hexadecimal #rrggbb, ou escolha no seletor."
                    />
                    <BrandColorField
                        id="accent-color-hex"
                        label="Cor de destaque"
                        value={accent}
                        onChange={hex => onChange('accentColor', hex)}
                        swatches={ACCENT_SWATCHES}
                        auto={{ active: storedAccent === '', label: 'Automática', onReset: () => onChange('accentColor', '') }}
                        hint="A segunda cor do guia (ex.: um dourado): fim dos gradientes dos títulos e brilhos decorativos. Vazia, usamos um dourado, ou um coral quando a marca já é dourada ou laranja."
                    />

                    <BrandContrastPanel color={color} accent={storedAccent} />

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
                        <Field label="Letra mono" hint="Datas, etiquetas e números pequenos.">
                            <AdminSelect value={settingsForm.fontMono ?? MONO_FONTS[0].family} onChange={e => onChange('fontMono', e.target.value)}>
                                {MONO_FONTS.map(f => <option key={f.family} value={f.family}>{f.family}</option>)}
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
                    <BrandPreview
                        color={color}
                        accent={storedAccent}
                        heading={settingsForm.fontHeading}
                        body={settingsForm.fontBody}
                        mono={settingsForm.fontMono}
                    />
                </div>
            </div>
        </div>
    );
};
