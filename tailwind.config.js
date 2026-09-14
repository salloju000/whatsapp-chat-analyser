/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Semantic tokens backed by CSS variables (defined in index.css), so a
      // single class works in both themes and no component hardcodes a hex.
      colors: {
        surface: {
          base: 'rgb(var(--surface-base) / <alpha-value>)',
          card: 'rgb(var(--surface-card) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
        },
        content: {
          primary: 'rgb(var(--content-primary) / <alpha-value>)',
          secondary: 'rgb(var(--content-secondary) / <alpha-value>)',
          muted: 'rgb(var(--content-muted) / <alpha-value>)',
        },
        edge: 'rgb(var(--edge) / <alpha-value>)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'aurora-a': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(8%, 6%, 0) scale(1.12)' },
        },
        'aurora-b': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1.05)' },
          '50%': { transform: 'translate3d(-10%, 4%, 0) scale(0.95)' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -12px, 0)' },
        },
        flow: {
          to: { strokeDashoffset: '-452' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.4s ease-out both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'bounce-slow': 'bounce-slow 2.5s ease-in-out infinite',
        'aurora-a': 'aurora-a 22s ease-in-out infinite',
        'aurora-b': 'aurora-b 28s ease-in-out infinite',
        float: 'float 7s ease-in-out infinite',
        flow: 'flow 9s linear infinite',
      },
    },
  },
  plugins: [],
};
