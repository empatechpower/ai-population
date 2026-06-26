import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#F6F1E8',
        card:     '#F9F6F1',
        elevated: '#FFFFFF',
        section:  '#EDE8DF',
        gold:     '#D4B06A',
        'gold-light': 'rgba(212,176,106,0.12)',
        'gold-border': 'rgba(212,176,106,0.35)',
        success:  '#1F7A5A',
        warning:  '#C26B2E',
        blue:     '#4A90C4',
        sage:     '#A8B9A5',
        lavender: '#8B85C1',
        purple:   '#667EEA',
        primary:  '#1A1816',
        secondary:'#7B7268',
        muted:    '#9A9094',
        border:   'rgba(180,155,120,0.18)',
        cream:    '#F6F1E8',
        charcoal: '#1A1816',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'Palatino Linotype', 'serif'],
        sans:  ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
        '4xl': '28px',
        pill:  '50px',
      },
      boxShadow: {
        card: '0 2px 18px rgba(150,120,80,0.07)',
        gold: '0 4px 28px rgba(212,176,106,0.12)',
      },
      fontSize: {
        '2xs': '10px',
        xs: '12px',
        sm: '13px',
        base: '14px',
        md: '15px',
        lg: '16px',
        xl: '18px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
        '5xl': '36px',
      },
    },
  },
  plugins: [],
}
export default config
