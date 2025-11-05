/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pv-black': '#0C0C0E',
        'pv-dark': '#18191B',
        'pv-darker': '#1F2022',
        'pv-text': '#E4E4E4',
        'pv-muted': '#A8A8A8',
        'pv-amber': '#F5A623',
        'pv-blue': '#2E9AFF',
        'pv-red': '#FF4040',
        'pv-green': '#5FFF96',
      },
      fontFamily: {
        'sans': ['Inter', 'Eurostile', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'wide': '0.08em',
        'wider': '0.15em',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        glow: {
          '0%, 100%': { 'box-shadow': '0 0 8px rgba(245, 166, 35, 0.3)' },
          '50%': { 'box-shadow': '0 0 16px rgba(245, 166, 35, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
