/**
 * Default Application Settings
 *
 * Provides the initial settings for the application, sourced from
 * Vite environment variables with sensible fallback defaults.
 */

import type { Settings } from '../types';
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_CHAT_MODEL_FALLBACK,
  DEFAULT_TTS_MODEL,
  DEFAULT_IMAGE_MODEL,
} from '../convex/lib/aiDefaults';

/**
 * Environment Variable Accessor
 *
 * Retrieves configuration from Vite environment variables with fallback support.
 * All client-side variables must use the VITE_ prefix.
 */
const getEnvVar = (key: string, fallback: string = ""): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || fallback;
  }
  return fallback;
};

/**
 * Parses a boolean environment variable string.
 * Returns true for "true", "1", "yes" (case-insensitive), false otherwise.
 */
const getEnvBool = (key: string, fallback: boolean): boolean => {
  const value = getEnvVar(key, String(fallback)).toLowerCase();
  return value === "true" || value === "1" || value === "yes";
};

/**
 * Parses a numeric environment variable.
 * Returns the fallback if parsing fails.
 */
const getEnvNumber = (key: string, fallback: number): number => {
  const value = parseInt(getEnvVar(key, String(fallback)), 10);
  return isNaN(value) ? fallback : value;
};

// Application Global Configuration
// Values sourced from environment variables with sensible defaults
export const INITIAL_SETTINGS: Settings = {
  // Site Identity
  // Generic demo identity: a fresh deployment shows a fictitious association
  // until Admin > Definições (or VITE_* in a private .env) supplies the real one
  siteName: getEnvVar("VITE_SITE_NAME", "ACR Vila Nova"),
  siteFullName: getEnvVar("VITE_SITE_FULL_NAME", "Associação Cultural e Recreativa de Vila Nova"),
  locality: getEnvVar("VITE_LOCALITY", "Vila Nova"),
  region: getEnvVar("VITE_REGION", ""),
  foundedYear: getEnvVar("VITE_FOUNDED_YEAR", "1985"),
  heroTagline: getEnvVar("VITE_HERO_TAGLINE", "Cultura. Desporto. Comunidade."),
  heroSubtitle: getEnvVar("VITE_HERO_SUBTITLE", "Desde 1985 a construir o futuro da comunidade."),
  historyIntro: getEnvVar("VITE_HISTORY_INTRO", "A associação nasceu da vontade de um grupo de residentes de criar um ponto de encontro para todas as gerações.\n\nO que começou numa pequena sede emprestada cresceu com o trabalho voluntário da comunidade, até se tornar a casa de todos.\n\nHoje continua a honrar esse espírito de união, adaptando-se aos novos tempos sem esquecer as suas raízes."),
  historyQuote: getEnvVar("VITE_HISTORY_QUOTE", "Construída com as mãos de quem cá vive, para quem cá vive."),
  venueName: getEnvVar("VITE_VENUE_NAME", "Sede da Associação"),
  venueDescription: getEnvVar("VITE_VENUE_DESCRIPTION", "A nossa sede dispõe de salão polivalente, bar associativo e espaços de convívio abertos a sócios e à população."),
  foundersNote: getEnvVar("VITE_FOUNDERS_NOTE", "Registados na ata da assembleia geral constituinte"),
  contactEmail: getEnvVar("VITE_CONTACT_EMAIL", "geral@exemplo.pt"),
  logoUrl: '',
  maintenanceMode: getEnvBool("VITE_MAINTENANCE_MODE", false),

  // AI Chatbot Configuration (uses latest Gemini 3.0 with 2.5 fallback)
  enableChatbot: getEnvBool("VITE_ENABLE_CHATBOT", true),
  showChatbotBubble: getEnvBool("VITE_SHOW_CHATBOT_BUBBLE", true),
  chatModel: getEnvVar("VITE_CHAT_MODEL", DEFAULT_CHAT_MODEL),
  chatModelFallback: getEnvVar("VITE_CHAT_MODEL_FALLBACK", DEFAULT_CHAT_MODEL_FALLBACK),
  thinkingBudget: getEnvNumber("VITE_THINKING_BUDGET", 512),
  ttsModel: getEnvVar("VITE_TTS_MODEL", DEFAULT_TTS_MODEL),

  // AI Content Generation
  defaultImageStyle: getEnvVar("VITE_DEFAULT_IMAGE_STYLE", "Cinematic lighting, photorealistic, 4k, community atmosphere, warm tones"),
  imageModel: getEnvVar("VITE_IMAGE_MODEL", DEFAULT_IMAGE_MODEL),
  contentTone: getEnvVar("VITE_CONTENT_TONE", "Profissional e Inspirador"),

  // AI Guardrails
  aiSystemPromptExtra: getEnvVar("VITE_AI_SYSTEM_PROMPT_EXTRA", ""),
  aiAllowedTopics: getEnvVar("VITE_AI_ALLOWED_TOPICS", "associação, eventos, cultura, desporto, comunidade"),
  aiForbiddenTopics: getEnvVar("VITE_AI_FORBIDDEN_TOPICS", "política partidária, religião, aconselhamento médico, conteúdo adulto"),
  aiGuardrailsEnabled: getEnvBool("VITE_AI_GUARDRAILS_ENABLED", true),
  imageResolution: getEnvVar("VITE_IMAGE_RESOLUTION", "1k"),

  // Contact & Location
  // Real contact data lives in the production DB settings (or VITE_PHONE in a
  // local, gitignored .env) — never hardcoded in the repository
  phone: getEnvVar("VITE_PHONE", ""),
  openingHours: getEnvVar("VITE_OPENING_HOURS", "Seg–Sex: 9:00–18:00 · Sáb–Dom: 13:00–23:00"),
  address: getEnvVar("VITE_ADDRESS", "Rua da Associação, 1, 0000-000 Vila Nova"),
  mapsUrl: getEnvVar("VITE_MAPS_URL", ""),
  latitude: getEnvVar("VITE_LATITUDE", "38.7223"),
  longitude: getEnvVar("VITE_LONGITUDE", "-9.1393"),

  // About Page Content (editable via Admin > Definições; these mirror the
  // original copy so the page renders before the DB is configured)
  aboutMission: getEnvVar("VITE_ABOUT_MISSION", "A associação promove a vida recreativa, cultural e desportiva da comunidade, realizando eventos que fomentam o convívio entre os associados e a população em geral."),
  aboutPillars: [
    { icon: "Target", title: "Convívio", description: "Combatemos o isolamento e promovemos o encontro entre gerações, com o bar associativo aberto aos domingos por voluntários." },
    { icon: "Shield", title: "Transparência", description: "Gestão voluntária e transparente, ao serviço dos cerca de 150 associados que fazem viver esta casa." },
    { icon: "Users", title: "Impacto Local", description: "Crescemos com a comunidade e com os parceiros locais, da autarquia às empresas da região." },
  ],

  // Social Media Integration
  facebookPageId: getEnvVar("VITE_FACEBOOK_PAGE_ID", ""),
  instagramUrl: getEnvVar("VITE_INSTAGRAM_URL", "")
};
