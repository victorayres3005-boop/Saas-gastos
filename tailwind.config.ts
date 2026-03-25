import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent:          'var(--accent)',
        'accent-light':  'var(--accent-light)',
        'accent-text':   'var(--accent-text)',
        'accent-hover':  'var(--accent-hover)',
        'bg-page':       'var(--bg-page)',
        'bg-surface':    'var(--bg-surface)',
        border:          'var(--border)',
        'border-light':  'var(--border-light)',
        'text-primary':  'var(--text-primary)',
        'text-secondary':'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        positive:        'var(--positive)',
        'positive-light':'var(--positive-light)',
        negative:        'var(--negative)',
        'negative-light':'var(--negative-light)',
        warning:         'var(--warning)',
        'warning-light': 'var(--warning-light)',
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
