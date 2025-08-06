/**
 * 🎨 SISMOBI Design System - Sistema de Design Unificado
 * Cores, tipografia, espaçamentos e componentes padronizados
 */

// ⚡ PALETA DE CORES MODERNA E ACESSÍVEL
export const colors = {
  // Cores primárias - Azul moderno para sistema imobiliário
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Cor principal
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },

  // Cores secundárias - Verde para sucesso e crescimento
  secondary: {
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

  // Estados e feedback
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },

  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },

  // Tons neutros - Base para layout
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },

  // Cores específicas para imobiliário
  property: {
    vacant: '#f59e0b', // Amarelo para vago
    rented: '#22c55e', // Verde para ocupado
    maintenance: '#ef4444' // Vermelho para manutenção
  }
};

// 📝 TIPOGRAFIA HIERÁRQUICA
export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
  },

  // Font sizes - Sistema fluido
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    '5xl': ['3rem', { lineHeight: '1' }],           // 48px
  },

  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  }
};

// 📐 ESPAÇAMENTOS CONSISTENTES
export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
  '4xl': '6rem',  // 96px
};

// 🎯 RAIOS DE BORDA MODERNOS
export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  default: '0.25rem', // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px'
};

// 🎭 SOMBRAS ELEGANTES
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
};

// ⚡ ANIMAÇÕES E TRANSIÇÕES
export const animation = {
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Curvas de animação
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// 📱 BREAKPOINTS RESPONSIVOS
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// 🎨 COMPONENTES PADRONIZADOS - Classes Utility
export const components = {
  // Botões
  button: {
    base: `
      inline-flex items-center justify-center
      font-medium transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      disabled:pointer-events-none
    `,
    sizes: {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-lg',
      xl: 'px-8 py-4 text-lg rounded-xl'
    },
    variants: {
      primary: `
        bg-primary-600 text-white shadow-sm
        hover:bg-primary-700 hover:shadow-md
        focus:ring-primary-500
        active:bg-primary-800
      `,
      secondary: `
        bg-gray-100 text-gray-900 border border-gray-300
        hover:bg-gray-200 hover:border-gray-400
        focus:ring-gray-500
        active:bg-gray-300
      `,
      success: `
        bg-success-600 text-white shadow-sm
        hover:bg-success-700 hover:shadow-md
        focus:ring-success-500
        active:bg-success-800
      `,
      danger: `
        bg-error-600 text-white shadow-sm
        hover:bg-error-700 hover:shadow-md
        focus:ring-error-500
        active:bg-error-800
      `,
      outline: `
        border border-gray-300 text-gray-700 bg-white
        hover:bg-gray-50 hover:border-gray-400
        focus:ring-primary-500
        active:bg-gray-100
      `
    }
  },

  // Cards
  card: {
    base: `
      bg-white rounded-xl border border-gray-200 shadow-sm
      transition-shadow duration-200
    `,
    interactive: `
      hover:shadow-md hover:border-gray-300
      cursor-pointer
    `,
    elevated: `
      shadow-lg border-0
    `
  },

  // Inputs
  input: {
    base: `
      block w-full rounded-lg border-gray-300 
      focus:ring-primary-500 focus:border-primary-500
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors duration-200
    `,
    error: `
      border-error-300 text-error-900 
      focus:ring-error-500 focus:border-error-500
    `,
    success: `
      border-success-300 text-success-900
      focus:ring-success-500 focus:border-success-500
    `
  },

  // Badges
  badge: {
    base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    variants: {
      primary: 'bg-primary-100 text-primary-800',
      success: 'bg-success-100 text-success-800', 
      warning: 'bg-warning-100 text-warning-800',
      error: 'bg-error-100 text-error-800',
      gray: 'bg-gray-100 text-gray-800'
    }
  }
};

// 🚀 UTILITÁRIOS DE APLICAÇÃO
export const utils = {
  // Combinar classes CSS
  cn: (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
  },

  // Obter classe de cor por status
  getStatusColor: (status: 'vacant' | 'rented' | 'maintenance'): string => {
    const statusColors = {
      vacant: 'bg-warning-100 text-warning-800 border-warning-200',
      rented: 'bg-success-100 text-success-800 border-success-200', 
      maintenance: 'bg-error-100 text-error-800 border-error-200'
    };
    return statusColors[status] || statusColors.vacant;
  },

  // Obter classe de prioridade
  getPriorityColor: (priority: 'low' | 'medium' | 'high' | 'critical'): string => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-warning-100 text-warning-800',
      high: 'bg-error-100 text-error-800', 
      critical: 'bg-error-600 text-white'
    };
    return priorityColors[priority] || priorityColors.medium;
  }
};

// Export default com todo o design system
const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  animation,
  breakpoints,
  components,
  utils
};

export default designSystem;