import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#FF6B35',
        'accent-light': '#FFF0EB',
        'accent-text': '#C94A1A',
        'accent-hover': '#E85A25',
        'bg-page': '#F5F5F5',
        'bg-surface': '#FFFFFF',
        border: '#E5E5E5',
        'border-light': '#EFEFEF',
        'text-primary': '#0A0A0A',
        'text-secondary': '#6B6B6B',
        'text-tertiary': '#A0A0A0',
        positive: '#16A34A',
        'positive-light': '#F0FDF4',
        negative: '#DC2626',
        'negative-light': '#FEF2F2',
        warning: '#D97706',
        'warning-light': '#FFFBEB',
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
