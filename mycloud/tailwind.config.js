/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // The signature 3-color palette from the user:
        // 1. Deep Obsidian / Forest Black: #050806
        // 2. Radiant Emerald Mint: #2fd697
        // 3. Crisp Pearl White & Silver: #f5f5f5 / #a0a6a3
        brand: {
          50: '#edfcf5',
          100: '#d5f7e7',
          200: '#aef0d3',
          300: '#75e4b6',
          400: '#3cd395',
          500: '#2fd697', // Exact user signature mint green
          600: '#1eb57c',
          700: '#188f63',
          800: '#187150',
          900: '#165d43',
          950: '#073424',
        },
        obsidian: {
          950: '#050806', // Exact user background
          900: '#090d0b',
          850: '#101210', // Exact user card surface
          800: '#151917',
          750: '#1a201c',
          700: '#222924',
          600: '#2d3731',
          border: '#1c2820', // Exact user card/pill border
          pill: '#13261e',   // Exact user pill background (#13261e)
          darkPill: '#2b2e2d', // Exact user secondary pill
        },
        mineral: {
          white: '#f5f5f5',  // Exact user heading text
          silver: '#a0a6a3', // Exact user subtitle/secondary text
          muted: '#707774',
        },
        purpleBrand: {
          500: '#2fd697',
          600: '#1eb57c',
          700: '#188f63',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.25s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

