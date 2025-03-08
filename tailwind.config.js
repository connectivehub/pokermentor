/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'casino-red': '#C41E3A',
        'casino-green': '#00693E',
        'casino-blue': '#003399',
        'casino-gold': '#D4AF37',
        'casino-black': '#121212',
        'felt-green': '#035E1C',
        'chip-white': '#F5F5F5',
        'chip-red': '#C41E3A',
        'chip-blue': '#1E3AC4',
        'chip-green': '#00693E',
        'chip-black': '#121212',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(212, 175, 55, 0.7), 0 0 20px rgba(212, 175, 55, 0.5), 0 0 30px rgba(212, 175, 55, 0.3)',
        'neon-red': '0 0 10px rgba(196, 30, 58, 0.7), 0 0 20px rgba(196, 30, 58, 0.5), 0 0 30px rgba(196, 30, 58, 0.3)',
        'neon-blue': '0 0 10px rgba(0, 51, 153, 0.7), 0 0 20px rgba(0, 51, 153, 0.5), 0 0 30px rgba(0, 51, 153, 0.3)',
        'neon-green': '0 0 10px rgba(0, 105, 62, 0.7), 0 0 20px rgba(0, 105, 62, 0.5), 0 0 30px rgba(0, 105, 62, 0.3)',
      },
      fontFamily: {
        'casino': ['Playfair Display', 'serif'],
        'digital': ['DM Mono', 'monospace'],
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s infinite',
        'flip-card': 'flip-card 0.5s ease-in-out forwards',
        'deal-card': 'deal-card 0.5s ease-out forwards',
        'chip-bounce': 'chip-bounce 0.5s ease-out forwards',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(212, 175, 55, 0.7)' },
          '50%': { boxShadow: '0 0 30px rgba(212, 175, 55, 1)' },
        },
        'flip-card': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'deal-card': {
          '0%': { transform: 'translateY(-100px) translateX(-50px) rotate(-15deg)', opacity: 0 },
          '100%': { transform: 'translateY(0) translateX(0) rotate(0)', opacity: 1 },
        },
        'chip-bounce': {
          '0%': { transform: 'translateY(-50px)', opacity: 0 },
          '70%': { transform: 'translateY(10px)' },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
} 