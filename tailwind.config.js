/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App*.jsx",
    "./main.jsx",
    "./Components/**/*.{js,jsx}",
    "./Hooks/**/*.{js,jsx}",
    "./Utils/**/*.{js,jsx}",
    "./Constants/**/*.{js,jsx}"
  ],
  safelist: [
    // 確保重要樣式類不被清除
    'shadow-lg',
    'shadow-xl', 
    'shadow-2xl',
    'rounded-xl',
    'rounded-2xl',
    'bg-gradient-to-br',
    'bg-gradient-to-r',
    'from-slate-50',
    'via-blue-50', 
    'to-indigo-100',
    'from-blue-50',
    'to-indigo-50',
    'from-green-50',
    'to-emerald-50',
    'from-purple-50',
    'to-pink-50',
    'from-blue-500',
    'to-indigo-600',
    'from-green-500',
    'to-emerald-600',
    'from-blue-600',
    'to-indigo-600',
    'from-green-600',
    'to-emerald-600',
    'animate-pulse',
    'animate-fade-in',
    'animate-scale-in',
    'hover:shadow-xl',
    'transform',
    'hover:scale-105',
    'backdrop-blur-sm',
    'bg-white/80',
    'border-white/60',
    'border-white/50',
    'bg-black/50',
    'text-transparent',
    'bg-clip-text',
    'focus:ring-2',
    'focus:ring-blue-500/20',
    'focus:ring-green-500/20',
    'focus:ring-purple-500/20',
    'focus:ring-amber-500/20',
    'focus:ring-indigo-500/20',
    'focus:ring-red-500/20',
    'focus:ring-gray-500/20',
    'transition-all',
    'duration-200'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'monospace']
      },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a'
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706'
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626'
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        slideIn: {
          'from': {
            transform: 'translateX(100%)',
            opacity: '0'
          },
          'to': {
            transform: 'translateX(0)',
            opacity: '1'
          }
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
