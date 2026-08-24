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
  siteName: getEnvVar("VITE_SITE_NAME", "ARCVA"),
  contactEmail: getEnvVar("VITE_CONTACT_EMAIL", "geral@arcva.pt"),
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
  aiAllowedTopics: getEnvVar("VITE_AI_ALLOWED_TOPICS", "ARCVA, Vale Alto, eventos, cultura, desporto, comunidade"),
  aiForbiddenTopics: getEnvVar("VITE_AI_FORBIDDEN_TOPICS", "política partidária, religião, aconselhamento médico, conteúdo adulto"),
  aiGuardrailsEnabled: getEnvBool("VITE_AI_GUARDRAILS_ENABLED", true),
  imageResolution: getEnvVar("VITE_IMAGE_RESOLUTION", "1k"),

  // Contact & Location
  // Real contact data lives in the production DB settings (or VITE_PHONE in a
  // local, gitignored .env) — never hardcoded in the repository
  phone: getEnvVar("VITE_PHONE", ""),
  openingHours: getEnvVar("VITE_OPENING_HOURS", "Seg–Sex: 9:00–18:00 · Sáb–Dom: 13:00–23:00"),
  address: getEnvVar("VITE_ADDRESS", "Largo do Pavilhão, N° 1, 2395-301 Minde, Vale Alto"),
  mapsUrl: getEnvVar("VITE_MAPS_URL", "https://maps.app.goo.gl/zzqN8LJMgkFKd2mn9"),
  latitude: getEnvVar("VITE_LATITUDE", "39.515469"),
  longitude: getEnvVar("VITE_LONGITUDE", "-8.586681"),

  // About Page Content (editable via Admin > Definições; these mirror the
  // original copy so the page renders before the DB is configured)
  aboutMission: "A ARCVA promove a vida recreativa, cultural e desportiva de Vale Alto, realizando eventos que fomentam o convívio entre os associados e a população em geral.",
  aboutPillars: [
    { icon: "Target", title: "Convívio", description: "Combatemos o isolamento e promovemos o encontro entre gerações, com o bar associativo aberto aos domingos por voluntários." },
    { icon: "Shield", title: "Transparência", description: "Gestão voluntária e transparente, ao serviço dos cerca de 150 associados que fazem viver esta casa." },
    { icon: "Users", title: "Impacto Local", description: "Crescemos com a comunidade e com os parceiros locais, da Câmara Municipal de Alcanena à Junta de Freguesia de Minde." },
  ],

  // Social Media Integration
  facebookPageId: getEnvVar("VITE_FACEBOOK_PAGE_ID", "arcvalealto"),
  instagramUrl: getEnvVar("VITE_INSTAGRAM_URL", "https://www.instagram.com/arcva_1982/")
};
