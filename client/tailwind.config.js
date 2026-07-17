/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
        },
        party: {
          pink: '#ec4899',
          red: '#f43f5e',
          orange: '#f59e0b',
          green: '#10b981',
          blue: '#3b82f6',
          purple: '#a855f7',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', '"Comic Sans MS"', 'ui-rounded', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
