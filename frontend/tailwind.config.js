/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // UI-SPEC 1.1 — semantic tokens mapped to CSS variables (see styles/tokens.css)
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-dim': 'rgb(var(--ink-dim) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-ink': 'rgb(var(--primary-ink) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        'muscle-primary': 'rgb(var(--muscle-primary) / <alpha-value>)',
        'muscle-secondary': 'rgb(var(--muscle-secondary) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        inner: '12px',
      },
      maxWidth: {
        app: '480px',
      },
      boxShadow: {
        active: '0 8px 24px -8px rgb(var(--primary) / 0.45)',
      },
    },
  },
  plugins: [],
}
