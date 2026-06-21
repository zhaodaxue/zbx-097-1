/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#f2f8f1',
          100: '#e1efdf',
          200: '#c3dfbe',
          300: '#9cc794',
          400: '#6eaa64',
          500: '#52b788',
          600: '#3d8b49',
          700: '#2d5a27',
          800: '#264a21',
          900: '#1e3c1c',
        },
        accent: {
          50: '#fdf4ea',
          100: '#fae4cb',
          200: '#f4c691',
          300: '#f4a261',
          400: '#ef853a',
          500: '#e76f1e',
          600: '#d95a17',
          700: '#b44315',
          800: '#903718',
          900: '#752f17',
        },
        status: {
          winning: '#16a34a',
          waiting: '#d97706',
          failed: '#dc2626',
          pending: '#6b7280',
        },
        market: {
          bg: '#faf8f5',
          paper: '#ffffff',
          ink: '#1f2937',
          muted: '#6b7280',
          border: '#e5e7eb',
        }
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
