'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AdminTheme, getThemeColors } from '@/lib/adminThemes';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface DashboardLayoutProps {
  children: ReactNode;
  lang: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  navSections: NavSection[];
  searchPlaceholder?: string;
  systemAlert?: {
    message: string;
    type?: 'warning' | 'info' | 'error';
  };
  notificationCount?: number;
  theme?: AdminTheme;
  onLogout?: () => void | Promise<void>;
}

export function DashboardLayout({
  children,
  lang,
  userName,
  userEmail,
  userAvatar,
  navSections,
  searchPlaceholder,
  systemAlert,
  notificationCount,
  theme = 'superadmin',
  onLogout,
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const themeColors = getThemeColors(theme);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div
      className="flex min-h-screen bg-gray-50"
      style={{
        ['--admin-primary' as any]: themeColors.primary,
        ['--admin-primary-hover' as any]: themeColors.primaryHover,
        ['--admin-primary-light' as any]: themeColors.primaryLight,
        ['--admin-accent' as any]: themeColors.accent,
        ['--admin-accent-hover' as any]: themeColors.accentHover,
      }}
    >
      {/* Sidebar */}
      <Sidebar
        lang={lang}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        isCollapsed={isSidebarCollapsed}
        navSections={navSections}
        theme={theme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          onSidebarToggle={handleSidebarToggle}
          searchPlaceholder={searchPlaceholder}
          systemAlert={systemAlert}
          notificationCount={notificationCount}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          onLogout={onLogout}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
