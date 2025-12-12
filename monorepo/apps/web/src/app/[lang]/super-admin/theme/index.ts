/**
 * Super Admin Dashboard Theme
 * Indigo/Purple color scheme for super admin interface
 */

export type ThemeType = 'superadmin';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  accent: string;
  accentHover: string;
}

export interface ComponentColors {
  gradient: string;
  iconBg: string;
  iconShadow: string;
  borderColor: string;
  accentColor: string;
}

export interface QuickActionColors {
  bg: string;
  text: string;
  icon: string;
  hoverBorder: string;
  hoverBg: string;
}

// Main theme colors
export const superAdminTheme: ThemeColors = {
  primary: '#6366f1',       // Indigo/Blue
  primaryHover: '#4f46e5',  // Darker indigo
  primaryLight: '#818cf8',  // Light indigo
  accent: '#8b5cf6',        // Purple accent
  accentHover: '#7c3aed',   // Darker purple
};

// Background gradient for layout
export const backgroundGradient = 'bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50/30';

// Theme identifier
export const themeId: ThemeType = 'superadmin';

// StatsCard primary colors
export const statsCardPrimaryColors: ComponentColors = {
  gradient: 'from-indigo-50 to-blue-50',
  iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
  iconShadow: 'shadow-lg shadow-indigo-500/30',
  borderColor: 'border-indigo-100',
  accentColor: 'bg-indigo-500',
};

// QuickActions primary colors
export const quickActionPrimaryColors: QuickActionColors = {
  bg: 'bg-indigo-50',
  text: 'text-indigo-700',
  icon: 'bg-gradient-to-br from-indigo-500 to-blue-600',
  hoverBorder: 'hover:border-indigo-300',
  hoverBg: 'hover:bg-indigo-50',
};

// Helper functions
export function getThemeColors(): ThemeColors {
  return superAdminTheme;
}

export function getThemeStyle(): Record<string, string> {
  return {
    '--admin-primary': superAdminTheme.primary,
    '--admin-primary-hover': superAdminTheme.primaryHover,
    '--admin-primary-light': superAdminTheme.primaryLight,
    '--admin-accent': superAdminTheme.accent,
    '--admin-accent-hover': superAdminTheme.accentHover,
  };
}
