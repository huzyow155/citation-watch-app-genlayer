/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        ledger: {
          bg: '#FCFAF8',
          paper: '#F7F4EF',
          ink: '#141413',
          muted: '#63625E',
          line: '#E7E3DC',
          accent: '#9E3A26', // warm brick/terracotta notary stamp red
        }
      }
    },
  },
  plugins: [],
}
