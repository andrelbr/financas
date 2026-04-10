/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        surface: 'rgba(255, 255, 255, 0.7)',
        surfaceHover: 'rgba(255, 255, 255, 0.9)',
        primary: '#3b82f6',
        success: '#10b981',
        danger: '#ef4444',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        'glass': '10px',
      }
    },
  },
  plugins: [],
}
