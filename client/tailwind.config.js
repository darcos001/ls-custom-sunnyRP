/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0e1326',
          panel: '#171c34',
          card: '#1b2140',
          input: '#11162b',
        },
        accent: {
          blue: '#3b82f6',
          green: '#22c55e',
          amber: '#f59e0b',
          purple: '#a855f7',
        },
      },
    },
  },
  plugins: [],
};
