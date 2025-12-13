/**
 * ThuLoBazaar Main Website Theme
 * ================================
 * Centralized theme configuration for the public-facing website
 * (Homepage, User Dashboard, Profile, Shop pages, etc.)
 *
 * Usage:
 *   import { colors, fonts, theme } from '@/lib/themes/main';
 *   // or
 *   import { getPrimaryColor, getButtonStyles } from '@/lib/themes/main';
 */

// ============================================
// Brand Colors
// ============================================
export const colors = {
  // Primary - Rose/Pink (Brand Identity)
  primary: {
    DEFAULT: '#f43f5e',
    hover: '#e11d48',
    light: '#fce7ec',
    dark: '#be123c',
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },

  // Secondary - Blue (Actions, Links)
  secondary: {
    DEFAULT: '#3b82f6',
    hover: '#2563eb',
    light: '#dbeafe',
    dark: '#1d4ed8',
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
  },

  // Success - Emerald (Confirmations, Verified)
  success: {
    DEFAULT: '#10b981',
    hover: '#059669',
    light: '#d1fae5',
    dark: '#047857',
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Warning - Amber (Alerts, Pending)
  warning: {
    DEFAULT: '#f59e0b',
    hover: '#d97706',
    light: '#fef3c7',
    dark: '#b45309',
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Danger - Red (Errors, Destructive)
  danger: {
    DEFAULT: '#dc2626',
    hover: '#b91c1c',
    light: '#fee2e2',
    dark: '#991b1b',
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Info - Sky Blue (Information, Tips)
  info: {
    DEFAULT: '#0ea5e9',
    hover: '#0284c7',
    light: '#e0f2fe',
    dark: '#0369a1',
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Neutral - Gray (Text, Borders, Backgrounds)
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
  },

  // Special Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Verification Badge Colors
  verification: {
    business: '#8b5cf6',      // Violet for Business Verified
    individual: '#06b6d4',    // Cyan for Individual Verified
    phone: '#10b981',         // Green for Phone Verified
  },

  // Ad Status Colors
  adStatus: {
    active: '#10b981',
    pending: '#f59e0b',
    rejected: '#dc2626',
    expired: '#6b7280',
    sold: '#8b5cf6',
  },
} as const;

// ============================================
// Typography
// ============================================
export const fonts = {
  // Font Families
  family: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    display: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },

  // Font Sizes (with line heights)
  size: {
    xs: { size: '0.75rem', lineHeight: '1rem' },       // 12px
    sm: { size: '0.875rem', lineHeight: '1.25rem' },   // 14px
    base: { size: '1rem', lineHeight: '1.5rem' },      // 16px
    lg: { size: '1.125rem', lineHeight: '1.75rem' },   // 18px
    xl: { size: '1.25rem', lineHeight: '1.75rem' },    // 20px
    '2xl': { size: '1.5rem', lineHeight: '2rem' },     // 24px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' },  // 36px
    '5xl': { size: '3rem', lineHeight: '1' },          // 48px
  },

  // Font Weights
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

// ============================================
// Spacing & Layout
// ============================================
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const;

// ============================================
// Border Radius
// ============================================
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================
// Shadows
// ============================================
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

// ============================================
// Transitions
// ============================================
export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  slower: '500ms ease',
} as const;

// ============================================
// Z-Index Scale
// ============================================
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// ============================================
// Breakpoints
// ============================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// Component Styles
// ============================================
export const componentStyles = {
  // Button Variants
  button: {
    primary: {
      bg: colors.primary.DEFAULT,
      bgHover: colors.primary.hover,
      text: colors.white,
      border: 'none',
    },
    secondary: {
      bg: colors.secondary.DEFAULT,
      bgHover: colors.secondary.hover,
      text: colors.white,
      border: 'none',
    },
    success: {
      bg: colors.success.DEFAULT,
      bgHover: colors.success.hover,
      text: colors.white,
      border: 'none',
    },
    danger: {
      bg: colors.danger.DEFAULT,
      bgHover: colors.danger.hover,
      text: colors.white,
      border: 'none',
    },
    outline: {
      bg: 'transparent',
      bgHover: colors.primary.light,
      text: colors.primary.DEFAULT,
      border: `2px solid ${colors.primary.DEFAULT}`,
    },
    ghost: {
      bg: 'transparent',
      bgHover: colors.gray[100],
      text: colors.gray[700],
      border: 'none',
    },
  },

  // Input Styles
  input: {
    default: {
      bg: colors.white,
      border: colors.gray[300],
      borderFocus: colors.primary.DEFAULT,
      text: colors.gray[900],
      placeholder: colors.gray[400],
    },
    error: {
      bg: colors.white,
      border: colors.danger.DEFAULT,
      borderFocus: colors.danger.DEFAULT,
      text: colors.gray[900],
      placeholder: colors.gray[400],
    },
  },

  // Card Styles
  card: {
    default: {
      bg: colors.white,
      border: colors.gray[200],
      shadow: shadows.sm,
    },
    elevated: {
      bg: colors.white,
      border: colors.gray[200],
      shadow: shadows.md,
    },
    interactive: {
      bg: colors.white,
      border: colors.gray[200],
      shadow: shadows.sm,
      hoverShadow: shadows.lg,
    },
  },

  // Badge Variants
  badge: {
    primary: {
      bg: colors.primary.light,
      text: colors.primary.DEFAULT,
    },
    secondary: {
      bg: colors.secondary.light,
      text: colors.secondary.DEFAULT,
    },
    success: {
      bg: colors.success.light,
      text: colors.success.DEFAULT,
    },
    warning: {
      bg: colors.warning.light,
      text: colors.warning.DEFAULT,
    },
    danger: {
      bg: colors.danger.light,
      text: colors.danger.DEFAULT,
    },
    info: {
      bg: colors.info.light,
      text: colors.info.DEFAULT,
    },
  },
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Get CSS variables for theme injection
 */
export function getThemeCSSVariables(): Record<string, string> {
  return {
    '--color-primary': colors.primary.DEFAULT,
    '--color-primary-hover': colors.primary.hover,
    '--color-primary-light': colors.primary.light,
    '--color-primary-dark': colors.primary.dark,
    '--color-secondary': colors.secondary.DEFAULT,
    '--color-secondary-hover': colors.secondary.hover,
    '--color-secondary-light': colors.secondary.light,
    '--color-success': colors.success.DEFAULT,
    '--color-success-hover': colors.success.hover,
    '--color-success-light': colors.success.light,
    '--color-warning': colors.warning.DEFAULT,
    '--color-warning-hover': colors.warning.hover,
    '--color-warning-light': colors.warning.light,
    '--color-danger': colors.danger.DEFAULT,
    '--color-danger-hover': colors.danger.hover,
    '--color-danger-light': colors.danger.light,
    '--color-info': colors.info.DEFAULT,
    '--color-info-hover': colors.info.hover,
    '--color-info-light': colors.info.light,
    '--font-sans': fonts.family.sans,
    '--font-mono': fonts.family.mono,
  };
}

/**
 * Get button styles by variant
 */
export function getButtonStyles(variant: keyof typeof componentStyles.button) {
  return componentStyles.button[variant];
}

/**
 * Get badge styles by variant
 */
export function getBadgeStyles(variant: keyof typeof componentStyles.badge) {
  return componentStyles.badge[variant];
}

/**
 * Get color by name (with optional shade)
 */
export function getColor(
  colorName: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'gray',
  shade: 'DEFAULT' | 'hover' | 'light' | 'dark' | '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' = 'DEFAULT'
): string {
  const colorObj = colors[colorName] as Record<string, string>;
  // Gray doesn't have DEFAULT, use 500 as default
  const fallback = colorName === 'gray' ? colorObj['500'] : colorObj['DEFAULT'];
  return colorObj[shade] ?? fallback ?? '#000000';
}

// ============================================
// Combined Theme Export
// ============================================
export const theme = {
  colors,
  fonts,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  components: componentStyles,
} as const;

// Default export
export default theme;
