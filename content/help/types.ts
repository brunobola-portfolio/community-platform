/**
 * Shape of the help center content. Tutorials are plain data so the board-facing
 * copy can be reviewed and updated without touching components.
 */

import type { Tab } from '../../pages/admin/types';

/** "direcao" tutorials live in the backoffice; "socio" ones also on the public /ajuda page. */
export type HelpAudience = 'direcao' | 'socio';

export type HelpCategoryId =
    | 'comecar'
    | 'eventos'
    | 'noticias'
    | 'ia'
    | 'equipa'
    | 'galeria'
    | 'socios'
    | 'acessos'
    | 'marca'
    | 'assistente'
    | 'boas-praticas'
    | 'suporte'
    | 'inscricoes-publico'
    | 'area-socio'
    | 'conta';

/** Icon keys resolved to lucide icons by the UI, so the content stays free of React. */
export type HelpIconKey =
    | 'rocket' | 'calendar' | 'newspaper' | 'sparkles' | 'users' | 'image' | 'wallet'
    | 'key' | 'palette' | 'bot' | 'shield' | 'ticket' | 'id-card' | 'user' | 'life-buoy';

export interface HelpCategory {
    id: HelpCategoryId;
    title: string;
    description: string;
    icon: HelpIconKey;
    audience: HelpAudience;
}

export interface HelpStep {
    /**
     * One action, at most 20 words; may carry {siteName}. Exact button and field
     * names go between **double asterisks** so the reader shows them in bold.
     */
    text: string;
    tip?: string;
    /** "Porquê": the reason behind a step people tend to skip. */
    why?: string;
    warning?: string;
}

export type HelpMedia =
    | { kind: 'image'; src: string; alt: string }
    | {
        kind: 'video';
        src: string;
        poster: string;
        /** Text equivalent of the silent clip, read instead of captions. */
        description: string;
    };

export interface HelpTutorial {
    id: string;
    category: HelpCategoryId;
    title: string;
    summary: string;
    /** "Em resumo": the whole guide in one sentence, for people who only skim. */
    recap: string;
    minutes: number;
    audience: HelpAudience;
    steps: HelpStep[];
    media?: HelpMedia[];
    /** Backoffice tab the tutorial is about; drives "Ir para" and the contextual help. */
    tab?: Tab;
    /** Other tabs whose "Como funciona" should also list this tutorial. */
    relatedTabs?: Tab[];
    keywords: string[];
    /** Guides offered at the end; defaults to the rest of the category. */
    related?: string[];
    /** Shown in the "Comece por aqui" row. */
    featured?: boolean;
}
