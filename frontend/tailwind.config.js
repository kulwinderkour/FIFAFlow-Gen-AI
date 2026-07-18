/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fifa: {
          dark: '#050a15',
          navy: '#0b132b',
          blue: '#1c2541',
          teal: '#00b4d8',
          green: '#00f2fe',
          pitch: '#00e676',
          gold: '#ffd700',
          red: '#ff1744'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 180, 216, 0.4)',
        'neon-green': '0 0 15px rgba(0, 230, 118, 0.4)',
        'neon-gold': '0 0 15px rgba(255, 215, 0, 0.4)',
        'neon-red': '0 0 15px rgba(255, 23, 68, 0.6)',
      }
    },
  },
  plugins: [],
}
