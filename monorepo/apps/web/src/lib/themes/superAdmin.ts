/**
 * Super Admin Theme Configuration
 * Color scheme: Indigo/Purple - represents authority and control
 */

import type { ThemeColors, ComponentColors, QuickActionColors, SidebarTheme } from './shared';

export const themeId = 'superadmin' as const;

// ============================================
// Core Theme Colors (CSS Variables)
// ============================================
export const superAdminTheme: ThemeColors = {
  primary: '#6366f1',      // indigo-500
  primaryHover: '#4f46e5', // indigo-600
  primaryLight: '#818cf8', // indigo-400
  accent: '#8b5cf6',       // violet-500
  accentHover: '#7c3aed',  // violet-600
};

// ============================================
// Background Gradients
// ============================================
export const backgroundGradient = 'bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50/30';

// ============================================
// StatsCard Primary Colors
// ============================================
export const statsCardPrimaryColors: ComponentColors = {
  gradient: 'from-indigo-50 to-blue-50',
  iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
  iconShadow: 'shadow-lg shadow-indigo-500/30',
  borderColor: 'border-indigo-100',
  accentColor: 'bg-indigo-500',
};

// ============================================
// QuickActions Primary Colors
// ============================================
export const quickActionPrimaryColors: QuickActionColors = {
  bg: 'bg-indigo-50',
  text: 'text-indigo-700',
  icon: 'bg-gradient-to-br from-indigo-500 to-blue-600',
  hoverBorder: 'hover:border-indigo-300',
  hoverBg: 'hover:bg-indigo-50',
};

// ============================================
// Sidebar Theme
// ============================================
export const sidebarTheme: SidebarTheme = {
  roleLabel: 'Super Admin',
  activeBg: 'bg-gradient-to-r from-indigo-500 to-blue-600',
  activeText: 'text-white',
  hoverBg: 'hover:bg-indigo-50',
  badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
};

// ============================================
// Helper Functions
// ============================================
export function getThemeColors(): ThemeColors {
  return superAdminTheme;
}

export function getThemeStyle(): React.CSSProperties {
  return {
    '--admin-primary': superAdminTheme.primary,
    '--admin-primary-hover': superAdminTheme.primaryHover,
    '--admin-primary-light': superAdminTheme.primaryLight,
    '--admin-accent': superAdminTheme.accent,
    '--admin-accent-hover': superAdminTheme.accentHover,
  } as React.CSSProperties;
}
