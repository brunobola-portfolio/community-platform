import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { brandContrastReport } from '../../../utils/brandPalette';
import { accentContrastReport } from '../../../utils/brandAccent';
import { LABEL_CLASS } from '../constants';

interface BrandContrastPanelProps {
    color: string;
    /** Stored accent; empty means automatic. */
    accent?: string;
}

interface ContrastRowProps {
    label: string;
    ratio: number;
    min: number;
}

const formatRatio = (ratio: number): string => `${ratio.toFixed(1).replace('.', ',')}:1`;

const ContrastRow: React.FC<ContrastRowProps> = ({ label, ratio, min }) => {
    const ok = ratio >= min;
    return (
        <li className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-300">
                {ok ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" aria-hidden="true" /> : <AlertTriangle size={16} className="text-amber-400 shrink-0" aria-hidden="true" />}
                {label}
            </span>
            <span className={cn('font-mono text-xs whitespace-nowrap', ok ? 'text-emerald-300' : 'text-amber-300')}>
                {formatRatio(ratio)} {ok ? (min >= 4.5 ? 'AA' : 'AA grande') : `abaixo de ${formatRatio(min)}`}
            </span>
        </li>
    );
};

interface GroupTitleProps {
    children: React.ReactNode;
}

const GroupTitle: React.FC<GroupTitleProps> = ({ children }) => (
    <li className="pt-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 first:pt-0">{children}</li>
);

/**
 * WCAG report for the three colour roles the brand drives: the brand scale
 * (buttons, links, dark-theme text), the display accent (large titles) and the
 * accent colour (gradient ends). Every figure is the worst case over the
 * surfaces that role is read on.
 */
export const BrandContrastPanel: React.FC<BrandContrastPanelProps> = ({ color, accent }) => {
    const brand = useMemo(() => brandContrastReport(color), [color]);
    const acc = useMemo(() => accentContrastReport(color, accent), [color, accent]);

    return (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className={LABEL_CLASS}>Contraste</p>
            <ul className="space-y-2">
                <GroupTitle>Marca</GroupTitle>
                <ContrastRow label="Texto branco nos botões" ratio={brand.textOn700} min={4.5} />
                <ContrastRow label="Títulos grandes na cor da marca" ratio={brand.largeOn600} min={3} />
                <ContrastRow label="Texto da marca no tema escuro" ratio={brand.darkText400} min={4.5} />
                <GroupTitle>Destaque dos títulos</GroupTitle>
                <ContrastRow label="Tema claro" ratio={brand.displayLight} min={3} />
                <ContrastRow label="Tema escuro" ratio={brand.displayDark} min={3} />
                <GroupTitle>Cor de destaque</GroupTitle>
                <ContrastRow label="Gradientes no tema claro" ratio={acc.light600} min={3} />
                <ContrastRow label="Gradientes e texto no tema escuro" ratio={acc.dark400} min={4.5} />
            </ul>
            <div className="mt-3 space-y-1 text-xs text-amber-200/90">
                {brand.adjusted && (
                    <p>A cor escolhida tem {formatRatio(brand.baseOnWhite)} com o branco. Nos botões e textos o portal usa automaticamente um tom mais escuro da mesma cor.</p>
                )}
                {brand.displayAdjusted && (
                    <p>No tema escuro a cor é escura demais para títulos; usamos um tom mais claro da mesma cor.</p>
                )}
                {acc.sameAsBrand && (
                    <p>A cor de destaque é praticamente igual à da marca: os gradientes vão ficar de uma só cor.</p>
                )}
            </div>
        </div>
    );
};
