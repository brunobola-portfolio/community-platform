import React, { useState } from 'react';
import { ArrowLeft, BookOpen, HelpCircle } from 'lucide-react';
import { Button, Modal } from '../../../components/ui/UIComponents';
import { TutorialCard } from '../../../components/help/TutorialCard';
import { TutorialReader } from '../../../components/help/TutorialReader';
import { HELP_TUTORIALS, getCategory, tutorialsForTab } from '../../../content/help';
import { TAB_NAMES } from '../constants';
import type { Tab } from '../types';

interface ContextHelpProps {
    tab: Tab;
    siteName: string;
    /** Opens the help tab, on the guide being read when there is one. */
    onOpenCenter: (tutorialId: string | null) => void;
}

const BACK = 'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

/** "Como funciona" next to the page title: the guides of the current tab, without leaving it. */
export const ContextHelp: React.FC<ContextHelpProps> = ({ tab, siteName, onOpenCenter }) => {
    const [open, setOpen] = useState(false);
    const [chosen, setChosen] = useState<string | null>(null);
    const guides = tutorialsForTab(HELP_TUTORIALS.filter(t => t.audience === 'direcao'), tab);
    if (guides.length === 0) return null;

    const reading = guides.length === 1 ? guides[0] : guides.find(g => g.id === chosen);
    const close = () => { setOpen(false); setChosen(null); };
    const toCenter = () => { close(); onOpenCenter(reading?.id ?? null); };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-brand-500/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
                <HelpCircle size={14} aria-hidden="true" /> Como funciona
            </button>
            <Modal
                isOpen={open}
                onClose={close}
                size="lg"
                icon={<HelpCircle size={20} />}
                eyebrow="Ajuda"
                title={`Como funciona: ${TAB_NAMES[tab]}`}
                description={reading ? undefined : 'Escolha um guia. Todos os guias estão no separador Ajuda.'}
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="ghost" onClick={close}>Fechar</Button>
                        <Button type="button" variant="outline" onClick={toCenter}><BookOpen size={16} aria-hidden="true" /> Abrir no centro de ajuda</Button>
                    </div>
                }
            >
                {reading ? (
                    <div className="space-y-4">
                        {guides.length > 1 && <button type="button" onClick={() => setChosen(null)} className={BACK}><ArrowLeft size={16} aria-hidden="true" /> Outros guias</button>}
                        <TutorialReader tutorial={reading} siteName={siteName} categoryTitle={getCategory(reading.category)?.title} headingLevel={3} />
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {guides.map(g => <TutorialCard key={g.id} tutorial={g} siteName={siteName} onSelect={setChosen} eyebrow={getCategory(g.category)?.title} />)}
                    </div>
                )}
            </Modal>
        </>
    );
};
