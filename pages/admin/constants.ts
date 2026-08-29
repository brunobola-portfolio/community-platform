
/**
 * Admin panel constants and shared utilities.
 */

import { Users, Lightbulb, Target, Heart, Sparkles, Handshake, Activity, Shield, Trophy, LucideIcon } from 'lucide-react';
import type { Tab } from './types';

export const ICON_MAP: Record<string, LucideIcon> = {
    Users, Lightbulb, Target, Heart, Sparkles, Handshake, Activity, Shield, Trophy
};

// Standardized input styling across the admin panel
// min-w-0 prevents grid children from overflowing their track (grid items
// default to min-width: auto, which lets long placeholder/content widths
// push past the column and clip neighbouring fields)
export const STD_INPUT_CLASS =
    "w-full min-w-0 bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-white placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 outline-none transition-all";

export const LABEL_CLASS =
    "text-xs font-mono text-brand-400 uppercase tracking-wider font-bold mb-1.5 block";

// Contextual label for the primary action of each list tab
export const NEW_LABELS: Partial<Record<Tab, string>> = {
    events: 'Novo evento', news: 'Nova notícia', members: 'Novo membro', sponsors: 'Novo parceiro',
    gallery: 'Novo álbum', documents: 'Novo documento', notifications: 'Nova notificação',
    categories: 'Nova categoria', tiers: 'Novo nível', homepage: 'Nova área', historia: 'Novo marco',
};

/** One line per tab explaining what it controls on the public site. */
export const TAB_DESCRIPTIONS: Partial<Record<Tab, string>> = {
    homepage: 'Áreas de atuação e números em destaque da página inicial.',
    events: 'Agenda pública, inscrições e torneios. Rascunhos ficam invisíveis no portal.',
    news: 'Notícias do blog. Só as publicadas aparecem no portal.',
    members: 'Corpos sociais mostrados na página Equipa, pela ordem definida.',
    sponsors: 'Apoios e parceiros mostrados na faixa da página inicial.',
    gallery: 'Álbuns e fotografias da galeria pública.',
    historia: 'Linha do tempo da página História.',
    leads: 'Mensagens de contacto e pedidos de parceria recebidos no portal.',
    'member-quotas': 'Registo de sócios e estado das quotas mostrado na área reservada.',
    documents: 'Estatutos, atas e regulamentos disponíveis aos sócios.',
    notifications: 'Avisos mostrados aos sócios com sessão iniciada.',
    categories: 'Categorias e cores usadas por eventos e notícias.',
    tiers: 'Níveis de parceria propostos no formulário de apoios.',
    ai: 'Fornecedor, modelos e limites do assistente do portal.',
    settings: 'Identidade, contactos, quotas e textos que alimentam todo o portal.',
};

export const TAB_NAMES: Record<Tab, string> = {
    dashboard: "Painel de Controlo",
    events: "Eventos",
    news: "Notícias",
    members: "Membros",
    sponsors: "Parceiros",
    categories: "Categorias",
    tiers: "Níveis de Parceria",
    settings: "Definições",
    documents: "Documentos",
    notifications: "Notificações",
    gallery: "Galeria",
    historia: "História",
    leads: "Leads & Contactos",
    "member-quotas": "Sócios & Quotas",
    homepage: "Personalização Homepage",
    ai: "IA & Chatbot"
};

/** Helper to format ISO dates for HTML datetime-local inputs */
export const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(date.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
};

export const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
};
