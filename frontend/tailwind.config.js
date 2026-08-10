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
          DEFAULT: '#00d0ff',
          dark: '#00a6d6',
        },
        accent: {
          DEFAULT: '#8a5cff',
          dark: '#6f3fff',
        },
        base: {
          DEFAULT: '#0b1b2a',
          light: '#112638',
        }
      },
    },
  },
  plugins: [],
}


