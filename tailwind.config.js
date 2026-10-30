/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bloom: {
          50: '#FFF5F9',
          100: '#FDF2F8',
          200: '#FCE7F3',
          300: '#FBCFE8',
          400: '#F9A8D4',
          500: '#F472B6',
          600: '#EC4899',
          700: '#DB2777',
          800: '#BE185D',
          900: '#9D174D',
          950: '#501B3E',
          plum: '#3B122D',
          night: '#181016',
          cardNight: '#251522',
          borderNight: '#4C183B',
          glow: '#FF70A6',
          champagne: '#FFE6EE'
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        decorative: ['"Cinzel Decorative"', 'serif'],
        soft: ['"Comfortaa"', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'pink-glow': '0 4px 20px -2px rgba(244, 114, 182, 0.35)',
        'plum-glow': '0 4px 25px -2px rgba(219, 39, 119, 0.4)',
        'petal': '0 2px 10px rgba(251, 207, 232, 0.45)',
      }
    },
  },
  plugins: [],
}
