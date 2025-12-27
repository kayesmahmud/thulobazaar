/**
 * Editor Dashboard Theme
 * Green/Teal color scheme for editor interface
 */

export type ThemeType = 'editor';

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
export const editorTheme: ThemeColors = {
  primary: '#10b981',       // Green
  primaryHover: '#059669',  // Darker green
  primaryLight: '#34d399',  // Light green
  accent: '#14b8a6',        // Teal accent
  accentHover: '#0d9488',   // Darker teal
};

// Background gradient for layout
export const backgroundGradient = 'bg-gradient-to-br from-gray-50 via-gray-50 to-emerald-50/30';

// Theme identifier
export const themeId: ThemeType = 'editor';

// StatsCard primary colors
export const statsCardPrimaryColors: ComponentColors = {
  gradient: 'from-emerald-50 to-green-50',
  iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
  iconShadow: 'shadow-lg shadow-emerald-500/30',
  borderColor: 'border-emerald-100',
  accentColor: 'bg-emerald-500',
};

// QuickActions primary colors
export const quickActionPrimaryColors: QuickActionColors = {
  bg: 'bg-emerald-50',
  text: 'text-emerald-700',
  icon: 'bg-gradient-to-br from-emerald-500 to-green-600',
  hoverBorder: 'hover:border-emerald-300',
  hoverBg: 'hover:bg-emerald-50',
};

// Helper functions
export function getThemeColors(): ThemeColors {
  return editorTheme;
}

export function getThemeStyle(): Record<string, string> {
  return {
    '--admin-primary': editorTheme.primary,
    '--admin-primary-hover': editorTheme.primaryHover,
    '--admin-primary-light': editorTheme.primaryLight,
    '--admin-accent': editorTheme.accent,
    '--admin-accent-hover': editorTheme.accentHover,
  };
}
