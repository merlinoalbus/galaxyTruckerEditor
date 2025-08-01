/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gt-primary': '#1e293b',
        'gt-secondary': '#334155',
        'gt-accent': '#3b82f6',
        'gt-success': '#10b981',
        'gt-warning': '#f59e0b',
        'gt-danger': '#ef4444',
      },
      fontFamily: {
        'game': ['Orbitron', 'monospace'],
      }
    },
  },
  plugins: [],
}