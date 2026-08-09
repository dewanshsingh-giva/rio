import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1D1B18', muted: '#767268', line: '#E7E3D9', paper: '#F9F8F5', card: '#FFFFFF',
        cream: '#FFF5F0',
        accent: '#B4780C', 'accent-light': '#D99A2B', 'accent-soft': '#FBF0DC', 'accent-line': '#E3B65C',
        signal: '#0F766E', 'signal-soft': '#E6F4F1',
        good: '#146B4B', 'good-soft': '#E7F3EC',
        warn: '#B4780C', 'warn-soft': '#FBF0DC',
        bad: '#A82142', 'bad-soft': '#F8E4E8',
        info: '#3E5C76', 'info-soft': '#E9EEF2',
      },
      fontFamily: {
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
