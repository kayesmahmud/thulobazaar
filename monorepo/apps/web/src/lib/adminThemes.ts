export type AdminTheme = 'superadmin' | 'editor';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  accent: string;
  accentHover: string;
}

export const adminThemes: Record<AdminTheme, ThemeColors> = {
  superadmin: {
    primary: '#6366f1',      // Indigo/Blue
    primaryHover: '#4f46e5',  // Darker indigo
    primaryLight: '#818cf8',  // Light indigo
    accent: '#8b5cf6',        // Purple accent
    accentHover: '#7c3aed',   // Darker purple
  },
  editor: {
    primary: '#10b981',       // Green
    primaryHover: '#059669',  // Darker green
    primaryLight: '#34d399',  // Light green
    accent: '#14b8a6',        // Teal accent
    accentHover: '#0d9488',   // Darker teal
  },
};

export function getThemeColors(theme: AdminTheme): ThemeColors {
  return adminThemes[theme];
}

// CSS custom properties for theme
export function getThemeStyle(theme: AdminTheme): string {
  const colors = getThemeColors(theme);
  return `
    --admin-primary: ${colors.primary};
    --admin-primary-hover: ${colors.primaryHover};
    --admin-primary-light: ${colors.primaryLight};
    --admin-accent: ${colors.accent};
    --admin-accent-hover: ${colors.accentHover};
  `;
}
