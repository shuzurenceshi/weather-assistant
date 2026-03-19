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
        sky: {
          light: '#87CEEB',
          DEFAULT: '#4A90D9',
          dark: '#2E5A8B',
        },
        sun: '#FFB347',
        rain: '#6B8DD6',
        snow: '#E8F4F8',
        warning: '#FF6B6B',
      },
    },
  },
  plugins: [],
}
export default config
