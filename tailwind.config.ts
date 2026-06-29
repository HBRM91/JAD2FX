/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#ECF3FA',
          100: '#C9DDEF',
          200: '#91B8D8',
          300: '#62A0CC',
          400: '#5090C0',
          500: '#4E7EAC',
          600: '#3A6490',
          700: '#1E3E5C',
          800: '#0E2336',
          900: '#081628',
          950: '#040C1C',
        },
        gold: {
          300: '#F2DC8A',
          400: '#E5C158',
          500: '#D4AF37',
          600: '#B5952F',
          700: '#8A7024',
          800: '#5E4D18',
          900: '#33290D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Cairo', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        arabic: ['Cairo', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
