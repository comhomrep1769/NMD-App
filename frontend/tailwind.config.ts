import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'nmd-green': {
          50: '#eaf7ef',
          100: '#c2edcf',
          200: '#84d4a0',
          300: '#4dba6e',
          400: '#2d9b50',
          500: '#22763c',
          600: '#1f6132',
          700: '#1a4d28',
          800: '#14381e',
          900: '#0d2414',
        },
        'nmd-blue': {
          50: '#e8f3fd',
          100: '#cfe5fb',
          200: '#96c8f5',
          300: '#5aa3e8',
          400: '#2b7fd4',
          500: '#1763a8',
          600: '#124d83',
          700: '#0d3860',
          800: '#082540',
          900: '#051929',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
