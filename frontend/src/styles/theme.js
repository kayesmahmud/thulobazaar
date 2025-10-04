/**
 * Thulobazaar Design System
 * Centralized styling constants for consistent UI/UX
 */

// Color Palette
export const colors = {
  // Brand Colors
  primary: '#dc1e4a',
  primaryHover: '#b91839',
  primaryLight: '#fce7ec',

  secondary: '#3b82f6',
  secondaryHover: '#2563eb',
  secondaryLight: '#dbeafe',

  // Status Colors
  success: '#10b981',
  successHover: '#059669',
  successLight: '#d1fae5',

  warning: '#f59e0b',
  warningHover: '#d97706',
  warningLight: '#fef3c7',

  danger: '#dc2626',
  dangerHover: '#b91c1c',
  dangerLight: '#fee2e2',

  info: '#0369a1',
  infoHover: '#075985',
  infoLight: '#f0f9ff',

  // Neutral Grays
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',

  // Semantic Colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    dark: '#1e293b'
  },

  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    muted: '#94a3b8',
    light: '#cbd5e1',
    inverse: '#ffffff'
  },

  border: {
    default: '#e2e8f0',
    hover: '#cbd5e1',
    focus: '#3b82f6',
    light: '#f1f5f9'
  },

  // Special Colors
  whatsapp: '#25d366',
  featured: '#f59e0b',
  verified: '#f59e0b'
};

// Spacing System (4px base)
export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',

  // Aliases
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px'
};

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px'
};

// Box Shadows
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
};

// Typography
export const typography = {
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px'
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  },

  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
    loose: '2'
  }
};

// Transitions
export const transitions = {
  fast: '150ms ease-in-out',
  normal: '300ms ease-in-out',
  slow: '500ms ease-in-out'
};

// Z-Index Layers
export const zIndex = {
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 900,
  modal: 1000,
  popover: 1100,
  tooltip: 1200
};

// Breakpoints (for media queries)
export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  laptop: '1024px',
  desktop: '1280px',
  wide: '1536px'
};

/**
 * Component Styles - Reusable style objects
 */
export const styles = {
  // Card Styles
  card: {
    default: {
      backgroundColor: colors.background.primary,
      border: `1px solid ${colors.border.default}`,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      boxShadow: shadows.sm
    },

    hover: {
      backgroundColor: colors.background.primary,
      border: `1px solid ${colors.border.default}`,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      boxShadow: shadows.md,
      transition: transitions.normal,
      cursor: 'pointer'
    },

    flat: {
      backgroundColor: colors.background.secondary,
      border: `1px solid ${colors.border.default}`,
      borderRadius: borderRadius.lg,
      padding: spacing.xl
    }
  },

  // Button Styles
  button: {
    primary: {
      backgroundColor: colors.primary,
      color: colors.text.inverse,
      padding: `${spacing.md} ${spacing.xl}`,
      borderRadius: borderRadius.md,
      border: 'none',
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.bold,
      cursor: 'pointer',
      transition: transitions.fast
    },

    secondary: {
      backgroundColor: 'transparent',
      color: colors.primary,
      padding: `${spacing.md} ${spacing.xl}`,
      borderRadius: borderRadius.md,
      border: `2px solid ${colors.primary}`,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.bold,
      cursor: 'pointer',
      transition: transitions.fast
    },

    success: {
      backgroundColor: colors.success,
      color: colors.text.inverse,
      padding: `${spacing.md} ${spacing.xl}`,
      borderRadius: borderRadius.md,
      border: 'none',
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.bold,
      cursor: 'pointer',
      transition: transitions.fast
    },

    danger: {
      backgroundColor: colors.danger,
      color: colors.text.inverse,
      padding: `${spacing.md} ${spacing.xl}`,
      borderRadius: borderRadius.md,
      border: 'none',
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.bold,
      cursor: 'pointer',
      transition: transitions.fast
    },

    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.secondary,
      padding: `${spacing.md} ${spacing.xl}`,
      borderRadius: borderRadius.md,
      border: `1px solid ${colors.border.default}`,
      fontSize: typography.fontSize.sm,
      cursor: 'pointer',
      transition: transitions.fast
    },

    whatsapp: {
      backgroundColor: colors.whatsapp,
      color: colors.text.inverse,
      padding: `${spacing.md} ${spacing.xl}`,
      borderRadius: borderRadius.md,
      border: 'none',
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.bold,
      cursor: 'pointer'
    }
  },

  // Input Styles
  input: {
    default: {
      width: '100%',
      padding: spacing.md,
      border: `1px solid ${colors.border.default}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.sm,
      outline: 'none',
      transition: transitions.fast,
      fontFamily: typography.fontFamily.base
    },

    large: {
      width: '100%',
      padding: spacing.lg,
      border: `1px solid ${colors.border.default}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.base,
      outline: 'none',
      transition: transitions.fast,
      fontFamily: typography.fontFamily.base
    }
  },

  // Modal Styles
  modal: {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: zIndex.modal
    },

    container: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.lg,
      padding: spacing['2xl'],
      width: '100%',
      maxWidth: '500px',
      margin: spacing.lg,
      position: 'relative',
      boxShadow: shadows.xl
    },

    closeButton: {
      position: 'absolute',
      top: spacing.lg,
      right: spacing.lg,
      background: 'none',
      border: 'none',
      fontSize: typography.fontSize['2xl'],
      cursor: 'pointer',
      color: colors.text.secondary,
      padding: 0,
      lineHeight: 1
    }
  },

  // Heading Styles
  heading: {
    h1: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.lg,
      lineHeight: typography.lineHeight.tight
    },

    h2: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.md
    },

    h3: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.md
    },

    h4: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.sm
    }
  },

  // Badge Styles
  badge: {
    default: {
      display: 'inline-block',
      padding: `${spacing.xs} ${spacing.md}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold
    },

    featured: {
      display: 'inline-block',
      backgroundColor: colors.featured,
      color: colors.text.inverse,
      padding: `${spacing.xs} ${spacing.md}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold
    },

    success: {
      display: 'inline-block',
      backgroundColor: colors.successLight,
      color: colors.success,
      padding: `${spacing.xs} ${spacing.md}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold
    },

    warning: {
      display: 'inline-block',
      backgroundColor: colors.warningLight,
      color: colors.warning,
      padding: `${spacing.xs} ${spacing.md}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold
    }
  },

  // Alert/Info Box Styles
  alert: {
    info: {
      backgroundColor: colors.infoLight,
      border: `1px solid ${colors.secondaryLight}`,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.fontSize.sm,
      color: colors.info
    },

    success: {
      backgroundColor: colors.successLight,
      border: `1px solid ${colors.success}`,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.fontSize.sm,
      color: colors.success
    },

    warning: {
      backgroundColor: colors.warningLight,
      border: `1px solid ${colors.warning}`,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.fontSize.sm,
      color: colors.warning
    },

    danger: {
      backgroundColor: colors.dangerLight,
      border: `1px solid ${colors.danger}`,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: typography.fontSize.sm,
      color: colors.danger
    }
  },

  // Avatar Styles
  avatar: {
    small: {
      width: '32px',
      height: '32px',
      borderRadius: borderRadius.full,
      objectFit: 'cover',
      border: `2px solid ${colors.border.default}`
    },

    medium: {
      width: '48px',
      height: '48px',
      borderRadius: borderRadius.full,
      objectFit: 'cover',
      border: `2px solid ${colors.border.default}`
    },

    large: {
      width: '64px',
      height: '64px',
      borderRadius: borderRadius.full,
      objectFit: 'cover',
      border: `2px solid ${colors.border.default}`
    },

    placeholder: {
      medium: {
        width: '48px',
        height: '48px',
        backgroundColor: colors.secondary,
        borderRadius: borderRadius.full,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.text.inverse,
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize.lg
      }
    }
  },

  // Image Styles
  image: {
    thumbnail: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: borderRadius.md
    },

    rounded: {
      borderRadius: borderRadius.lg,
      overflow: 'hidden'
    }
  },

  // Link Styles
  link: {
    default: {
      color: colors.primary,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: transitions.fast
    },

    muted: {
      color: colors.text.secondary,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: transitions.fast
    }
  },

  // Form Label
  label: {
    default: {
      display: 'block',
      marginBottom: spacing.xs,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.primary
    }
  },

  // Divider
  divider: {
    default: {
      height: '1px',
      backgroundColor: colors.border.default,
      border: 'none',
      margin: `${spacing.lg} 0`
    }
  }
};

// Helper functions
export const helpers = {
  // Create hover effect
  hover: (baseStyle, hoverChanges) => ({
    ...baseStyle,
    ':hover': {
      ...baseStyle,
      ...hoverChanges
    }
  }),

  // Create focus effect
  focus: (baseStyle, focusChanges) => ({
    ...baseStyle,
    ':focus': {
      ...baseStyle,
      borderColor: colors.border.focus,
      boxShadow: `0 0 0 3px ${colors.secondaryLight}`,
      ...focusChanges
    }
  }),

  // Responsive helper (returns media query string)
  media: (breakpoint) => `@media (min-width: ${breakpoints[breakpoint]})`
};

export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  transitions,
  zIndex,
  breakpoints,
  styles,
  helpers
};
