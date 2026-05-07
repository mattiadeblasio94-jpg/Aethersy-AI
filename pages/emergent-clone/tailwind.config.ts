import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './page.tsx',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#ededed',
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#8b5cf6',
        muted: '#262626',
        border: '#404040',
      },
    },
  },
  plugins: [],
}

export default config
