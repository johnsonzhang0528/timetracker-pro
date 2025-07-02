/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.jsx",
    "./main.jsx",
    "./Components/**/*.{js,jsx}",
    "./Hooks/**/*.{js,jsx}",
    "./Utils/**/*.{js,jsx}",
    "./Constants/**/*.{js,jsx}"
  ],
  safelist: [
    // 確保重要的動態樣式類不被清除
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
    'from-blue-600',
    'to-blue-700',
    'from-green-500',
    'to-green-600',
    'animate-pulse',
    'animate-fade-in',
    'animate-slide-up',
    'animate-scale-in',
    'hover:shadow-xl',
    'transform',
    'hover:scale-105',
    'active:scale-95',
    // 響應式工具類
    'sm:block',
    'sm:hidden',
    'lg:block',
    'lg:hidden',
    'xl:block',
    'xl:hidden',
    // 觸控優化
    'min-h-[44px]',
    'min-h-[48px]',
    'touch-target',
    'touch-friendly'
  ],
  theme: {
    // 自定義斷點 - Mobile First
    screens: {
      'xs': '375px',   // 大手機
      'sm': '640px',   // 小平板
      'md': '768px',   // 平板
      'lg': '1024px',  // 桌面
      'xl': '1280px',  // 大桌面
      '2xl': '1536px', // 超大桌面
      // 自定義斷點
      'mobile': '375px',
      'tablet': '768px',
      'desktop': '1024px',
      'wide': '1280px',
      // 裝置類型斷點
      'touch': {'raw': '(hover: none)'},
      'mouse': {'raw': '(hover: hover)'},
      'retina': {'raw': '(-webkit-min-device-pixel-ratio: 2)'},
    },
    extend: {
      // 字體家族優化
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji'
        ],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Roboto Mono',
          'monospace'
        ]
      },
      
      // 顏色系統 - 擴展調色盤
      colors: {
        // 主色調
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        
        // 成功色
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        
        // 警告色
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        
        // 錯誤色
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        
        // 灰階 - 優化對比度
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      },
      
      // 間距系統 - 響應式優化
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // 觸控友好的間距
        'touch': '2.75rem', // 44px
        'touch-lg': '3rem', // 48px
        // 安全區域間距
        'safe': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)'
      },
      
      // 字體大小 - 響應式優化
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
        // 移動端專用字體大小
        'mobile-xs': ['0.8rem', { lineHeight: '1.1rem' }],
        'mobile-sm': ['0.9rem', { lineHeight: '1.3rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.5rem' }],
        'mobile-lg': ['1.1rem', { lineHeight: '1.6rem' }],
        // 時間顯示專用
        'time': ['2.5rem', { lineHeight: '1', letterSpacing: '0.05em' }],
        'time-lg': ['3.5rem', { lineHeight: '1', letterSpacing: '0.05em' }],
        'time-xl': ['4.5rem', { lineHeight: '1', letterSpacing: '0.05em' }]
      },
      
      // 陰影系統 - 層次優化
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.3)',
        // 移動端優化陰影
        'mobile': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'mobile-lg': '0 4px 12px rgba(0, 0, 0, 0.15)',
        // 特殊效果
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
      },
      
      // 圓角系統
      borderRadius: {
        'xs': '0.125rem',
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      
      // 動畫系統 - 性能優化
      animation: {
        // 基礎動畫
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        
        // 特殊動畫
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        
        // 載入動畫
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        
        // 手機專用動畫 (較短時間)
        'mobile-fade': 'fadeIn 0.2s ease-out',
        'mobile-slide': 'slideUp 0.2s ease-out'
      },
      
      // 動畫關鍵幀
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        fadeOut: {
          'from': { opacity: '1' },
          'to': { opacity: '0' }
        },
        slideIn: {
          'from': { 
            opacity: '0',
            transform: 'translateX(100%)' 
          },
          'to': { 
            opacity: '1',
            transform: 'translateX(0)' 
          }
        },
        slideOut: {
          'from': { 
            opacity: '1',
            transform: 'translateX(0)' 
          },
          'to': { 
            opacity: '0',
            transform: 'translateX(-100%)' 
          }
        },
        slideUp: {
          'from': { 
            opacity: '0',
            transform: 'translateY(20px)' 
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)' 
          }
        },
        slideDown: {
          'from': { 
            opacity: '0',
            transform: 'translateY(-20px)' 
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)' 
          }
        },
        scaleIn: {
          'from': { 
            opacity: '0',
            transform: 'scale(0.95)' 
          },
          'to': { 
            opacity: '1',
            transform: 'scale(1)' 
          }
        },
        scaleOut: {
          'from': { 
            opacity: '1',
            transform: 'scale(1)' 
          },
          'to': { 
            opacity: '0',
            transform: 'scale(0.95)' 
          }
        },
        bounceSubtle: {
          '0%, 100%': { 
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' 
          },
          '50%': { 
            transform: 'translateY(-5px)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' 
          }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        },
        skeleton: {
          '0%': { 
            backgroundColor: '#f0f0f0' 
          },
          '50%': { 
            backgroundColor: '#e0e0e0' 
          },
          '100%': { 
            backgroundColor: '#f0f0f0' 
          }
        },
        shimmer: {
          '0%': { 
            backgroundPosition: '200% 0' 
          },
          '100%': { 
            backgroundPosition: '-200% 0' 
          }
        }
      },
      
      // 轉場時間
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms'
      },
      
      // Z-index 層級管理
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'auto': 'auto',
        // 特定組件層級
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080'
      },
      
      // 斷點容器
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          'sm': '2rem',
          'lg': '4rem',
          'xl': '5rem',
          '2xl': '6rem'
        },
        screens: {
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
          '2xl': '1536px'
        }
      }
    }
  },
  plugins: [
    // 自定義插件
    function({ addUtilities, addComponents, theme }) {
      // 觸控優化工具類
      addUtilities({
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px'
        },
        '.touch-target-lg': {
          minHeight: '48px',
          minWidth: '48px'
        },
        // 安全區域工具類
        '.safe-area-top': {
          paddingTop: 'max(1rem, env(safe-area-inset-top))'
        },
        '.safe-area-bottom': {
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        },
        '.safe-area-left': {
          paddingLeft: 'max(1rem, env(safe-area-inset-left))'
        },
        '.safe-area-right': {
          paddingRight: 'max(1rem, env(safe-area-inset-right))'
        },
        // 性能優化工具類
        '.gpu-accelerated': {
          transform: 'translateZ(0)',
          willChange: 'transform'
        },
        '.contain-layout': {
          contain: 'layout'
        },
        '.contain-paint': {
          contain: 'paint'
        }
      });
      
      // 響應式組件
      addComponents({
        '.btn-responsive': {
          padding: '0.75rem 1rem',
          minHeight: '44px',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          '@screen sm': {
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            fontSize: '1rem'
          },
          '@screen lg': {
            padding: '1rem 2rem',
            borderRadius: '1rem',
            fontSize: '1.125rem'
          }
        },
        '.card-responsive': {
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          '@screen sm': {
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          },
          '@screen lg': {
            borderRadius: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }
        }
      });
    }
  ]
}
