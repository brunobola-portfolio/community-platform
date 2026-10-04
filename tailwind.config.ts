import type { Config } from 'tailwindcss';
import { CATEGORY_COLOR_CLASSES, CATEGORY_LABEL_CLASSES } from './utils/categoryColors';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** `{ 50: 'rgb(var(--name-50) / <alpha-value>)', … }` for a runtime colour scale. */
function scale(name: string): Record<string, string> {
  return Object.fromEntries(STEPS.map((step) => [step, `rgb(var(--${name}-${step}) / <alpha-value>)`]));
}

const config: Config = {
  darkMode: 'class',
  // Category colours are chosen in the backoffice and stored in the database,
  // so they never appear in any scanned source file
  safelist: [...CATEGORY_COLOR_CLASSES, ...CATEGORY_LABEL_CLASSES],
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './layouts/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Brand tokens are CSS variables written at runtime from settings (see
      // components/BrandTheme.tsx); index.css holds the platform defaults so the
      // first paint is right before any JS runs
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-heading)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Space-separated RGB channels keep opacity modifiers (bg-brand-500/10) working
        brand: {
          ...scale('brand'),
          // Large display accents: the brand colour itself where 3:1 allows,
          // switched per theme in index.css
          display: 'rgb(var(--brand-display) / <alpha-value>)',
        },
        // Every slate class follows the brand-tinted neutrals: same luminance
        // per step as Tailwind's slate (so audited contrast holds), brand hue
        slate: scale('neutral'),
        dark: {
          bg: 'rgb(var(--neutral-950) / <alpha-value>)',
          surface: 'rgb(var(--neutral-900) / <alpha-value>)',
          border: 'rgb(var(--neutral-50) / 0.08)',
        },
        accent: {
          ...scale('accent'),
          // Fixed on purpose: the "Destaque" badge and gold tiers mean the same
          // thing on every instance, whatever the brand accent is
          gold: '#fbbf24',
          glow: 'rgb(var(--brand-600) / 0.5)',
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        marquee: 'marquee 40s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':
          'conic-gradient(from 180deg at 50% 50%, rgb(var(--brand-600)) 0deg, #000000 180deg, rgb(var(--brand-600)) 360deg)',
      },
    },
  },
  plugins: [],
};

export default config;
