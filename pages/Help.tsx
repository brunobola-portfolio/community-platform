import React from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { HelpCenter } from '../components/help/HelpCenter';
import { Button } from '../components/ui/UIComponents';
import { useData } from '../context/DataContext';
import { categoriesFor, HELP_PARAM, tutorialsFor } from '../content/help';
import type { HelpContact, HelpHero } from '../components/help/types';
import type { LayoutOutletContext } from '../layouts/types';
import type { Settings } from '../types';

const TUTORIALS = tutorialsFor('socio');
const CATEGORIES = categoriesFor('socio');

const HERO: HelpHero = {
    eyebrow: 'Ajuda',
    title: 'Como podemos ajudar?',
    text: 'Respostas rápidas para sócios e visitantes da {siteName}: inscrições em eventos, área de sócio, quotas e palavra-passe.',
    placeholder: 'Ex.: inscrever-me, pagar a quota, palavra-passe…',
    suggestions: ['inscrições', 'palavra-passe', 'quota', 'cartão de sócio'],
};

const CONTACT_LINK = 'inline-flex items-center gap-2 rounded text-slate-700 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:text-brand-400 [overflow-wrap:anywhere]';

interface ContactsProps {
    settings: Settings;
    onContact: () => void;
}

const Contacts: React.FC<ContactsProps> = ({ settings, onContact }) => (
    <section aria-labelledby="help-contacts" className="flex flex-col gap-6 rounded-3xl border border-slate-900/10 bg-white p-6 dark:border-white/10 dark:bg-dark-surface md:flex-row md:items-center md:justify-between md:p-8">
        <div className="space-y-2">
            <h2 id="help-contacts" className="font-serif text-2xl text-slate-900 dark:text-white">Ainda com dúvidas?</h2>
            <p className="max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">A direção da {settings.siteName} responde. Escreva-nos ou use um dos contactos.</p>
            <ul className="space-y-2 pt-2 text-sm">
                {settings.contactEmail && <li><a href={`mailto:${settings.contactEmail}`} className={CONTACT_LINK}><Mail size={16} aria-hidden="true" className="shrink-0 text-brand-700 dark:text-brand-400" /> {settings.contactEmail}</a></li>}
                {settings.phone && <li><a href={`tel:${settings.phone.replace(/\s/g, '')}`} className={CONTACT_LINK}><Phone size={16} aria-hidden="true" className="shrink-0 text-brand-700 dark:text-brand-400" /> {settings.phone}</a></li>}
                {settings.address && <li className="flex items-start gap-2 text-slate-700 dark:text-slate-300"><MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-400" /> {settings.address}</li>}
            </ul>
        </div>
        <Button onClick={onContact} className="w-full shrink-0 md:w-auto"><MessageCircle size={18} aria-hidden="true" /> Contacte-nos</Button>
    </section>
);

/** Public help for members and visitors; the board's guides live in the backoffice "Ajuda" tab. */
export const HelpPage: React.FC = () => {
    const { settings } = useData();
    const { openContact } = useOutletContext<LayoutOutletContext>();
    const [params, setParams] = useSearchParams();
    const requestedId = params.get(HELP_PARAM);
    const selected = TUTORIALS.find(t => t.id === requestedId);

    const select = (id: string | null) => setParams(id ? { [HELP_PARAM]: id } : {});
    const contact: HelpContact = {
        title: 'Não encontrou o que procurava?',
        text: 'A direção da {siteName} responde a todas as mensagens.',
        actionLabel: 'Fale com a direção',
        onClick: () => openContact('Geral'),
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 pt-28 dark:bg-dark-bg sm:pt-32">
            <PageMeta
                title={selected ? `${selected.title} · Ajuda` : 'Ajuda'}
                description={`Guias rápidos da ${settings.siteName}: inscrições em eventos, área de sócio, quotas e palavra-passe.`}
            />
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <HelpCenter
                    tutorials={TUTORIALS}
                    categories={CATEGORIES}
                    siteName={settings.siteName}
                    selectedId={requestedId}
                    onSelect={select}
                    hero={HERO}
                    linkPath="/ajuda"
                    contact={contact}
                    footer={<Contacts settings={settings} onContact={() => openContact('Geral')} />}
                />
            </div>
        </div>
    );
};
