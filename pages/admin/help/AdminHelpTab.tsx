import React from 'react';
import { ExternalLink } from 'lucide-react';
import { HelpCenter } from '../../../components/help/HelpCenter';
import { useData } from '../../../context/DataContext';
import { categoriesFor, HELP_TUTORIALS } from '../../../content/help';
import type { HelpContact, HelpHero } from '../../../components/help/types';
import type { HelpTutorial } from '../../../content/help';
import { TAB_NAMES } from '../constants';
import type { Tab } from '../types';

interface AdminHelpTabProps {
    siteName: string;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onGoToTab: (tab: Tab) => void;
}

const HERO: HelpHero = {
    eyebrow: 'Centro de ajuda',
    title: 'Como podemos ajudar?',
    text: 'Guias curtos, passo a passo, para gerir o site da {siteName} sem complicações. Pesquise ou escolha um tema.',
    placeholder: 'Ex.: confirmar inscrições, mudar a cor, dar acesso…',
    suggestions: ['inscrições', 'palavra-passe', 'cartaz', 'custos'],
};

// The board also sees the members' guides, so it can answer a member's question with the same words
const CATEGORY_ORDER = [...categoriesFor('direcao'), ...categoriesFor('socio')];
const ORDERED = CATEGORY_ORDER.flatMap(c => HELP_TUTORIALS.filter(t => t.category === c.id));
const FEATURED = ORDERED.filter(t => t.featured && t.audience === 'direcao');

/** mailto when the association set a contact email; otherwise only a pointer, never a dead button. */
function technicalContact(email: string | undefined): HelpContact {
    const base = { title: 'Não encontrou o que procurava?', actionLabel: 'Peça ajuda à equipa técnica' };
    if (!email) return { ...base, text: 'Fale com a pessoa que gere o site na {siteName}: ela sabe quem contactar.' };
    return {
        ...base,
        text: 'Descreva o que estava a fazer e junte uma captura de ecrã, se puder.',
        href: `mailto:${email}?subject=${encodeURIComponent('Ajuda com o backoffice')}`,
    };
}

const MembersNote: React.FC = () => (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>Os guias para sócios e visitantes também estão no site, na página pública de ajuda. Partilhe o link quando um sócio tiver dúvidas.</p>
        <a
            href="/ajuda"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs font-semibold text-slate-200 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
            <ExternalLink size={14} aria-hidden="true" /> Abrir a ajuda pública
        </a>
    </div>
);

export const AdminHelpTab: React.FC<AdminHelpTabProps> = ({ siteName, selectedId, onSelect, onGoToTab }) => {
    const { settings } = useData();
    const goToFor = (tutorial: HelpTutorial) => {
        const tab = tutorial.tab;
        return tab && tab !== 'help' ? { label: `Ir para ${TAB_NAMES[tab]}`, onClick: () => onGoToTab(tab) } : undefined;
    };

    return (
        <HelpCenter
            tutorials={ORDERED}
            categories={CATEGORY_ORDER}
            featured={FEATURED}
            siteName={siteName}
            selectedId={selectedId}
            onSelect={onSelect}
            goToFor={goToFor}
            hero={HERO}
            linkPath="/admin"
            contact={technicalContact(settings.contactEmail?.trim() || undefined)}
            footer={<MembersNote />}
        />
    );
};
