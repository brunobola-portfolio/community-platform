import type { Config } from 'tailwindcss';
import { CATEGORY_COLOR_CLASSES, CATEGORY_LABEL_CLASSES } from './utils/categoryColors';

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
      },
      colors: {
        // Space-separated RGB channels keep opacity modifiers (bg-brand-500/10) working
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
          950: 'rgb(var(--brand-950) / <alpha-value>)',
        },
        dark: {
          bg: '#020617', // Deep Slate for background
          surface: '#0f172a', // Lighter Slate for cards
          border: 'rgba(255, 255, 255, 0.08)',
        },
        accent: {
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
