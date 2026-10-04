import React from 'react';
import { ExternalLink } from 'lucide-react';
import { HelpCenter } from '../../../components/help/HelpCenter';
import { categoriesFor, HELP_TUTORIALS } from '../../../content/help';
import type { HelpTutorial } from '../../../content/help';
import { TAB_NAMES } from '../constants';
import type { Tab } from '../types';

interface AdminHelpTabProps {
    siteName: string;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onGoToTab: (tab: Tab) => void;
}

const HERO = {
    eyebrow: 'Centro de ajuda',
    title: 'Como podemos ajudar?',
    text: 'Guias curtos, passo a passo, para gerir o site da {siteName} sem complicações. Pesquise ou escolha um tema.',
    placeholder: 'Ex.: confirmar inscrições, mudar a cor, dar acesso…',
};

// The board also sees the members' guides, so it can answer a member's question with the same words
const CATEGORY_ORDER = [...categoriesFor('direcao'), ...categoriesFor('socio')];
const ORDERED = CATEGORY_ORDER.flatMap(c => HELP_TUTORIALS.filter(t => t.category === c.id));

const MembersNote: React.FC = () => (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>Os guias para sócios e visitantes também estão no site, na página pública de ajuda. Partilhe o link quando um sócio tiver dúvidas.</p>
        <a
            href="/ajuda"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
            <ExternalLink size={14} aria-hidden="true" /> Abrir a ajuda pública
        </a>
    </div>
);

export const AdminHelpTab: React.FC<AdminHelpTabProps> = ({ siteName, selectedId, onSelect, onGoToTab }) => {
    const goToFor = (tutorial: HelpTutorial) => {
        const tab = tutorial.tab;
        return tab && tab !== 'help' ? { label: `Ir para ${TAB_NAMES[tab]}`, onClick: () => onGoToTab(tab) } : undefined;
    };

    return (
        <HelpCenter
            tutorials={ORDERED}
            categories={CATEGORY_ORDER}
            siteName={siteName}
            selectedId={selectedId}
            onSelect={onSelect}
            goToFor={goToFor}
            hero={HERO}
            footer={<MembersNote />}
        />
    );
};
