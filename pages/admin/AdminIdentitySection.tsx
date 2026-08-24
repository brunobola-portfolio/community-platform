import React from 'react';
import { Landmark } from 'lucide-react';
import { STD_INPUT_CLASS, LABEL_CLASS } from './constants';
import type { Settings } from '../../types';

interface AdminIdentitySectionProps {
    settingsForm: Settings;
    onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

interface FieldSpec {
    key: keyof Settings;
    label: string;
    placeholder: string;
    rows?: number;
    hint?: string;
}

// Every public string that names the association or its locality is edited
// here; the code never hardcodes identity (white-label rule)
const FIELDS: FieldSpec[] = [
    { key: 'siteFullName', label: 'Nome completo', placeholder: 'Associação Cultural e Recreativa de ...', hint: 'Usado pelo assistente IA e em textos institucionais' },
    { key: 'locality', label: 'Localidade', placeholder: 'Ex: Vila Nova', hint: 'Primeira linha do hero da homepage e referências "em <localidade>"' },
    { key: 'region', label: 'Concelho / região', placeholder: 'Ex: Santarém' },
    { key: 'foundedYear', label: 'Ano de fundação', placeholder: 'Ex: 1985' },
    { key: 'heroTagline', label: 'Tagline do hero', placeholder: 'Cultura. Desporto. Comunidade.' },
    { key: 'heroSubtitle', label: 'Subtítulo do hero', placeholder: 'Desde 1985 a construir o futuro da comunidade.' },
    { key: 'venueName', label: 'Nome da sede / pavilhão', placeholder: 'Ex: Pavilhão Municipal' },
    { key: 'venueDescription', label: 'Descrição da sede', placeholder: 'A nossa sede dispõe de ...', rows: 2 },
    { key: 'historyIntro', label: 'Introdução da página História', placeholder: 'Parágrafos separados por uma linha em branco', rows: 6, hint: 'Uma linha em branco separa parágrafos' },
    { key: 'historyQuote', label: 'Citação em destaque (História)', placeholder: 'Frase curta atribuída aos fundadores' },
    { key: 'foundersNote', label: 'Nota dos sócios fundadores', placeholder: 'Registados na ata da assembleia constituinte' },
];

export const AdminIdentitySection: React.FC<AdminIdentitySectionProps> = ({ settingsForm, onChange }) => (
    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-serif text-white mb-2 flex items-center gap-2">
            <Landmark className="text-brand-400" /> Identidade & Textos
        </h3>
        <p className="text-sm text-slate-400 mb-6">
            Tudo o que nomeia a associação no portal público vem daqui. Campos vazios escondem a secção correspondente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.map(({ key, label, placeholder, rows, hint }) => {
                const value = (settingsForm[key] as string | undefined) ?? '';
                const wide = Boolean(rows);
                return (
                    <div key={key} className={wide ? 'md:col-span-2' : undefined}>
                        <label className={LABEL_CLASS}>{label}</label>
                        {rows ? (
                            <textarea rows={rows} value={value} onChange={e => onChange(key, e.target.value)} className={STD_INPUT_CLASS} placeholder={placeholder} />
                        ) : (
                            <input value={value} onChange={e => onChange(key, e.target.value)} className={STD_INPUT_CLASS} placeholder={placeholder} />
                        )}
                        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
                    </div>
                );
            })}
        </div>
    </div>
);
