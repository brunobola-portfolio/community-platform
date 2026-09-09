/// <reference types="vite/client" />

/** Platform version, replaced at build time from package.json (vite.config.ts). */
declare const __PLATFORM_VERSION__: string;

interface Window {
  webkitAudioContext: typeof AudioContext;
}

interface ImportMetaEnv {
    readonly VITE_CONVEX_URL: string;
    readonly VITE_SENTRY_DSN?: string;
    readonly VITE_SENTRY_ENVIRONMENT?: string;
    readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
    readonly VITE_SITE_NAME?: string;
    readonly VITE_CONTACT_EMAIL?: string;
    readonly VITE_MAINTENANCE_MODE?: string;
    readonly VITE_ENABLE_CHATBOT?: string;
    readonly VITE_SHOW_CHATBOT_BUBBLE?: string;
    readonly VITE_CHAT_MODEL?: string;
    readonly VITE_CHAT_MODEL_FALLBACK?: string;
    readonly VITE_THINKING_BUDGET?: string;
    readonly VITE_DEFAULT_IMAGE_STYLE?: string;
    readonly VITE_IMAGE_MODEL?: string;
    readonly VITE_CONTENT_TONE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
