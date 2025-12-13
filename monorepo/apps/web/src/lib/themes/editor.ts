/**
 * Editor Theme Configuration
 * Color scheme: Emerald/Green - represents growth and moderation
 */

import type { ThemeColors, ComponentColors, QuickActionColors, SidebarTheme } from './shared';

export const themeId = 'editor' as const;

// ============================================
// Core Theme Colors (CSS Variables)
// ============================================
export const editorTheme: ThemeColors = {
  primary: '#10b981',      // emerald-500
  primaryHover: '#059669', // emerald-600
  primaryLight: '#34d399', // emerald-400
  accent: '#14b8a6',       // teal-500
  accentHover: '#0d9488',  // teal-600
};

// ============================================
// Background Gradients
// ============================================
export const backgroundGradient = 'bg-gradient-to-br from-gray-50 via-gray-50 to-emerald-50/30';

// ============================================
// StatsCard Primary Colors
// ============================================
export const statsCardPrimaryColors: ComponentColors = {
  gradient: 'from-emerald-50 to-green-50',
  iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
  iconShadow: 'shadow-lg shadow-emerald-500/30',
  borderColor: 'border-emerald-100',
  accentColor: 'bg-emerald-500',
};

// ============================================
// QuickActions Primary Colors
// ============================================
export const quickActionPrimaryColors: QuickActionColors = {
  bg: 'bg-emerald-50',
  text: 'text-emerald-700',
  icon: 'bg-gradient-to-br from-emerald-500 to-green-600',
  hoverBorder: 'hover:border-emerald-300',
  hoverBg: 'hover:bg-emerald-50',
};

// ============================================
// Sidebar Theme
// ============================================
export const sidebarTheme: SidebarTheme = {
  roleLabel: 'Editor',
  activeBg: 'bg-gradient-to-r from-emerald-500 to-green-600',
  activeText: 'text-white',
  hoverBg: 'hover:bg-emerald-50',
  badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
};

// ============================================
// Helper Functions
// ============================================
export function getThemeColors(): ThemeColors {
  return editorTheme;
}

export function getThemeStyle(): React.CSSProperties {
  return {
    '--admin-primary': editorTheme.primary,
    '--admin-primary-hover': editorTheme.primaryHover,
    '--admin-primary-light': editorTheme.primaryLight,
    '--admin-accent': editorTheme.accent,
    '--admin-accent-hover': editorTheme.accentHover,
  } as React.CSSProperties;
}
