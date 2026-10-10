/** @type {import('tailwindcss').Config} */
const path = require('path')

module.exports = {
  darkMode: 'class',
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,jsx,ts,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#14b8a6',
          dark: '#0e7f74',
        },
        accent: {
          DEFAULT: '#8a5cff',
          dark: '#6f3fff',
        },
        base: {
          DEFAULT: '#0f1724',
          light: '#112638',
        }
      },
    },
  },
  plugins: [],
}


