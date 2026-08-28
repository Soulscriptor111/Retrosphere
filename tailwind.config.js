/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: '#4A3728',
        'wood-dark': '#3D2C1F',
        cream: '#F5EDE0',
        brass: '#C9A84C',
        amber: '#F5A623',
        paper: '#E8D5B8',
        'warm-white': '#FAF0E6',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        cabinet: 'inset 0 2px 6px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.5)',
        knob: '0 3px 0 rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
      },
      transitionTimingFunction: {
        organic: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
