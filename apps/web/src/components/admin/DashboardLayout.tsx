'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { EditorBottomNav } from './EditorBottomNav';
import { AdminTheme, getThemeColors, getBackgroundGradient } from '@/lib/themes';

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
  systemAlert?: {
    message: string;
    type?: 'warning' | 'info' | 'error';
  };
  notificationCount?: number;
  theme?: AdminTheme;
  onLogout?: () => void | Promise<void>;
  onExportReport?: () => void;
  lastLogin?: string | null;
}

export function DashboardLayout({
  children,
  lang,
  userName,
  userEmail,
  userAvatar,
  navSections,
  systemAlert,
  notificationCount,
  theme = 'superadmin',
  onLogout,
  onExportReport,
  lastLogin,
}: DashboardLayoutProps) {
  // Desktop rail stays expanded; there is no desktop collapse trigger.
  const [isSidebarCollapsed] = useState(false);
  // Mobile off-canvas drawer (opened by the header hamburger on < lg).
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const themeColors = getThemeColors(theme);

  // Close the mobile drawer whenever the route changes (e.g. tapping a nav link).
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // The notifications page currently only exists for editors; show the bell only there.
  const onNotificationsClick =
    theme === 'editor' ? () => router.push(`/${lang}/editor/notifications`) : undefined;

  const handleSidebarToggle = () => {
    setIsDrawerOpen((open) => !open);
  };

  // Theme-specific background gradient
  const backgroundGradient = getBackgroundGradient(theme);

  return (
    <div
      className={`flex min-h-screen ${backgroundGradient}`}
      style={{
        ['--admin-primary' as any]: themeColors.primary,
        ['--admin-primary-hover' as any]: themeColors.primaryHover,
        ['--admin-primary-light' as any]: themeColors.primaryLight,
        ['--admin-accent' as any]: themeColors.accent,
        ['--admin-accent-hover' as any]: themeColors.accentHover,
      }}
    >
      {/* Mobile drawer overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        lang={lang}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        isCollapsed={isSidebarCollapsed}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        navSections={navSections}
        theme={theme}
      />

      {/* Main Content Area — min-w-0 lets the flex child shrink; overflow guard
          keeps any wide inner content from pushing the whole page sideways. */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Header */}
        <Header
          onSidebarToggle={handleSidebarToggle}
          systemAlert={systemAlert}
          notificationCount={notificationCount}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          onLogout={onLogout}
          theme={theme}
          showDashboardButton={theme === 'editor'}
          lastLogin={lastLogin}
          onExportReport={onExportReport}
          onNotificationsClick={onNotificationsClick}
        />

        {/* Content Area — extra bottom padding on mobile clears the editor tab bar */}
        <main className={`flex-1 p-4 lg:p-8 ${theme === 'editor' ? 'pb-24 lg:pb-8' : ''}`}>
          {children}
        </main>
      </div>

      {/* Editor mobile bottom tab bar */}
      {theme === 'editor' && <EditorBottomNav lang={lang} />}
    </div>
  );
}
