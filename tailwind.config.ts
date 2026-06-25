import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary:  '#0A0F1E',
          surface:  '#111827',
          elevated: '#1E293B',
        },
        border: {
          default: 'rgba(255,255,255,0.08)',
          hover:   'rgba(255,255,255,0.15)',
        },
        text: {
          primary:   '#F1F5F9',
          secondary: '#94A3B8',
          muted:     '#64748B',
        },
        accent: {
          teal: '#00C896',
          gold: '#D4A017',
          blue: '#3B82F6',
        },
        positive:    '#22C55E',
        negative:    '#EF4444',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      keyframes: {
        'flash-green': {
          '0%':   { backgroundColor: 'rgba(34,197,94,0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-red': {
          '0%':   { backgroundColor: 'rgba(239,68,68,0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'flash-green': 'flash-green 800ms ease-out forwards',
        'flash-red':   'flash-red 800ms ease-out forwards',
        shimmer:       'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
