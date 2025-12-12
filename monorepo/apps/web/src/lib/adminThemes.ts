/**
 * Admin Themes - Central export for both editor and super-admin themes
 * Each theme is defined in its respective folder for better separation
 */

// Re-export editor theme
export {
  editorTheme,
  backgroundGradient as editorBackgroundGradient,
  themeId as editorThemeId,
  statsCardPrimaryColors as editorStatsCardColors,
  quickActionPrimaryColors as editorQuickActionColors,
  getThemeColors as getEditorThemeColors,
  getThemeStyle as getEditorThemeStyle,
} from '@/app/[lang]/editor/theme';

// Re-export super-admin theme
export {
  superAdminTheme,
  backgroundGradient as superAdminBackgroundGradient,
  themeId as superAdminThemeId,
  statsCardPrimaryColors as superAdminStatsCardColors,
  quickActionPrimaryColors as superAdminQuickActionColors,
  getThemeColors as getSuperAdminThemeColors,
  getThemeStyle as getSuperAdminThemeStyle,
} from '@/app/[lang]/super-admin/theme';

// Re-export types
export type { ThemeColors, ComponentColors, QuickActionColors } from '@/app/[lang]/editor/theme';

// Combined theme type
export type AdminTheme = 'superadmin' | 'editor';

// Legacy support - get theme colors by theme name
export function getThemeColors(theme: AdminTheme) {
  if (theme === 'editor') {
    return {
      primary: '#10b981',
      primaryHover: '#059669',
      primaryLight: '#34d399',
      accent: '#14b8a6',
      accentHover: '#0d9488',
    };
  }
  return {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryLight: '#818cf8',
    accent: '#8b5cf6',
    accentHover: '#7c3aed',
  };
}

// Legacy support - get background gradient by theme
export function getBackgroundGradient(theme: AdminTheme): string {
  return theme === 'editor'
    ? 'bg-gradient-to-br from-gray-50 via-gray-50 to-emerald-50/30'
    : 'bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50/30';
}
