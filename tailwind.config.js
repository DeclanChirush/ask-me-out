/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50:  '#fff1f7',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          900: '#831843',
        },
        ink:      '#831843',
        'ink-soft': '#a44b73',
        cream:    '#fff7fb',
        'pink-bg': '#fff0f6',
      },
      fontFamily: {
        sans: ['Nunito', 'Noto Sans Sinhala', 'system-ui', 'sans-serif'],
        sin:  ['"Noto Sans Sinhala"', 'Nunito', 'sans-serif'],
        script: ['Caveat', 'cursive'],
      },
      boxShadow: {
        pink:    '0 8px 24px -10px rgba(190, 24, 93, 0.35)',
        'pink-lg':'0 30px 60px -20px rgba(190, 24, 93, 0.45)',
      },
      keyframes: {
        heartFloat: {
          '0%':   { transform: 'translateY(110%) translateX(0) scale(.7) rotate(-8deg)', opacity: '0' },
          '10%':  { opacity: '.9' },
          '50%':  { transform: 'translateY(40%) translateX(20px) scale(1) rotate(6deg)' },
          '100%': { transform: 'translateY(-30%) translateX(-10px) scale(.9) rotate(-4deg)', opacity: '0' },
        },
        sakuraFall: {
          '0%':   { transform: 'translateY(-10%) translateX(0) rotate(0deg)', opacity: '0' },
          '10%':  { opacity: '.85' },
          '100%': { transform: 'translateY(110vh) translateX(80px) rotate(540deg)', opacity: '0' },
        },
        twinkle: {
          '0%, 100%': { opacity: '.25', transform: 'scale(.85)' },
          '50%':      { opacity: '1',   transform: 'scale(1.15)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%':      { transform: 'scale(1.08)' },
          '28%':      { transform: 'scale(1)' },
          '42%':      { transform: 'scale(1.05)' },
          '70%':      { transform: 'scale(1)' },
        },
        livePulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(236, 72, 153, .55)' },
          '70%':      { boxShadow: '0 0 0 12px rgba(236, 72, 153, 0)' },
        },
      },
      animation: {
        'heart-float': 'heartFloat 6s ease-in infinite',
        'sakura-fall': 'sakuraFall 10s linear infinite',
        twinkle:       'twinkle 2.5s ease-in-out infinite',
        heartbeat:     'heartbeat 1.4s ease-in-out infinite',
        'live-pulse':  'livePulse 1.4s ease-out infinite',
      },
    },
  },
  plugins: [],
};
