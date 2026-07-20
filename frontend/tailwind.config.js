/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // High-end premium palette
        brand: {
          50: '#f0f4ff',
          100: '#dbe5ff',
          200: '#bfd0ff',
          300: '#94b0ff',
          400: '#6086ff',
          500: '#3b5cfa', // Royal Blue
          600: '#253df5',
          700: '#1c2be0',
          800: '#1723b8',
          900: '#192391',
        },
        dark: {
          50: '#f6f6f9',
          100: '#ececf3',
          200: '#d5d5e3',
          300: '#b1b1cc',
          400: '#8484ad',
          500: '#636391',
          600: '#4e4e77',
          700: '#383857',
          800: '#1b1b2f', // Rich Midnight Blue/Black
          850: '#141425', // Intermediate dark shade
          900: '#0d0d18', // True Pitch Black
          950: '#06060c',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
