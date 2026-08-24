import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
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
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        // ARCVA red, anchored on the original logo colour #df3d32
        brand: {
          50: '#fef3f2',
          100: '#fde5e3',
          200: '#fbcfcb',
          300: '#f7aaa4',
          400: '#ef7a70',
          500: '#e65649',
          600: '#df3d32', // Original logo red
          700: '#bb2d24',
          800: '#9a2820',
          900: '#802621',
          950: '#45100c',
        },
        dark: {
          bg: '#020617', // Deep Slate for background
          surface: '#0f172a', // Lighter Slate for cards
          border: 'rgba(255, 255, 255, 0.08)',
        },
        accent: {
          gold: '#fbbf24',
          glow: 'rgba(223, 61, 50, 0.5)',
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
          'conic-gradient(from 180deg at 50% 50%, #df3d32 0deg, #000000 180deg, #df3d32 360deg)',
      },
    },
  },
  plugins: [],
};

export default config;
