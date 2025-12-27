/**
 * ThuLoBazaar Theme System
 * ========================
 * Central export hub for all themes
 *
 * Usage:
 *   // Admin themes
 *   import { getThemeColors, AdminTheme } from '@/lib/themes';
 *
 *   // Main website theme
 *   import { colors, fonts } from '@/lib/themes/main';
 */

// ============================================
// Shared Types & Utilities
// ============================================
export {
  type AdminTheme,
  type ThemeColors,
  type ComponentColors,
  type QuickActionColors,
  type SidebarTheme,
  sharedColorClasses,
} from './shared';

// ============================================
// Editor Theme Exports
// ============================================
export {
  editorTheme,
  themeId as editorThemeId,
  backgroundGradient as editorBackgroundGradient,
  statsCardPrimaryColors as editorStatsCardColors,
  quickActionPrimaryColors as editorQuickActionColors,
  sidebarTheme as editorSidebarTheme,
  getThemeColors as getEditorThemeColors,
  getThemeStyle as getEditorThemeStyle,
} from './editor';

// ============================================
// Super Admin Theme Exports
// ============================================
export {
  superAdminTheme,
  themeId as superAdminThemeId,
  backgroundGradient as superAdminBackgroundGradient,
  statsCardPrimaryColors as superAdminStatsCardColors,
  quickActionPrimaryColors as superAdminQuickActionColors,
  sidebarTheme as superAdminSidebarTheme,
  getThemeColors as getSuperAdminThemeColors,
  getThemeStyle as getSuperAdminThemeStyle,
} from './superAdmin';

// ============================================
// Main Website Theme Exports
// ============================================
export {
  colors as mainColors,
  fonts as mainFonts,
  theme as mainTheme,
} from './main';

// ============================================
// Theme Selector Functions (Admin Panels)
// ============================================
import type { AdminTheme, ThemeColors } from './shared';
import { editorTheme } from './editor';
import { superAdminTheme } from './superAdmin';
import {
  statsCardPrimaryColors as editorStats,
  quickActionPrimaryColors as editorQuickAction,
  backgroundGradient as editorBg,
  sidebarTheme as editorSidebar,
} from './editor';
import {
  statsCardPrimaryColors as superAdminStats,
  quickActionPrimaryColors as superAdminQuickAction,
  backgroundGradient as superAdminBg,
  sidebarTheme as superAdminSidebar,
} from './superAdmin';

/**
 * Get theme colors by theme name
 */
export function getThemeColors(theme: AdminTheme): ThemeColors {
  return theme === 'editor' ? editorTheme : superAdminTheme;
}

/**
 * Get background gradient by theme
 */
export function getBackgroundGradient(theme: AdminTheme): string {
  return theme === 'editor' ? editorBg : superAdminBg;
}

/**
 * Get role label by theme
 */
export function getRoleLabel(theme: AdminTheme): string {
  return theme === 'editor' ? editorSidebar.roleLabel : superAdminSidebar.roleLabel;
}

/**
 * Get StatsCard primary colors by theme
 */
export function getStatsCardPrimaryColors(theme: AdminTheme) {
  return theme === 'editor' ? editorStats : superAdminStats;
}

/**
 * Get QuickActions primary colors by theme
 */
export function getQuickActionPrimaryColors(theme: AdminTheme) {
  return theme === 'editor' ? editorQuickAction : superAdminQuickAction;
}

/**
 * Get Sidebar theme by theme name
 */
export function getSidebarTheme(theme: AdminTheme) {
  return theme === 'editor' ? editorSidebar : superAdminSidebar;
}
