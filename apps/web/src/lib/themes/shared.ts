/**
 * Shared Theme Types and Utilities
 * Common definitions used across all admin themes
 */

// ============================================
// Type Definitions
// ============================================

export type AdminTheme = 'superadmin' | 'editor';

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

export interface SidebarTheme {
  roleLabel: string;
  activeBg: string;
  activeText: string;
  hoverBg: string;
  badgeBg: string;
}

// ============================================
// Shared Color Classes (same for all themes)
// ============================================
export const sharedColorClasses = {
  success: {
    gradient: 'from-teal-50 to-cyan-50',
    iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    iconShadow: 'shadow-lg shadow-teal-500/30',
    borderColor: 'border-teal-100',
    accentColor: 'bg-teal-500',
    // QuickAction colors
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    icon: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    hoverBorder: 'hover:border-teal-300',
    hoverBg: 'hover:bg-teal-50',
  },
  warning: {
    gradient: 'from-amber-50 to-orange-50',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconShadow: 'shadow-lg shadow-amber-500/30',
    borderColor: 'border-amber-100',
    accentColor: 'bg-amber-500',
    // QuickAction colors
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'bg-gradient-to-br from-amber-500 to-orange-600',
    hoverBorder: 'hover:border-amber-300',
    hoverBg: 'hover:bg-amber-50',
  },
  danger: {
    gradient: 'from-rose-50 to-red-50',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
    iconShadow: 'shadow-lg shadow-rose-500/30',
    borderColor: 'border-rose-100',
    accentColor: 'bg-rose-500',
    // QuickAction colors
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    icon: 'bg-gradient-to-br from-rose-500 to-red-600',
    hoverBorder: 'hover:border-rose-300',
    hoverBg: 'hover:bg-rose-50',
  },
  gray: {
    gradient: 'from-gray-50 to-slate-50',
    iconBg: 'bg-gradient-to-br from-gray-500 to-slate-600',
    iconShadow: 'shadow-lg shadow-gray-500/30',
    borderColor: 'border-gray-100',
    accentColor: 'bg-gray-500',
    // QuickAction colors
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    icon: 'bg-gradient-to-br from-gray-500 to-slate-600',
    hoverBorder: 'hover:border-gray-300',
    hoverBg: 'hover:bg-gray-50',
  },
} as const;
