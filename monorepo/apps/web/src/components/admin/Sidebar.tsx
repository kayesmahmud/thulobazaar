'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

interface SidebarProps {
  lang: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  navSections: NavSection[];
  theme?: 'superadmin' | 'editor';
}

export function Sidebar({
  lang,
  userName = 'Editor User',
  userEmail = 'editor@thulobazaar.com',
  userAvatar,
  isCollapsed = false,
  navSections,
  theme = 'editor',
}: SidebarProps) {
  const pathname = usePathname();
  const roleLabel = theme === 'editor' ? 'Editor' : 'Super Admin';

  return (
    <aside
      className={`
        ${isCollapsed ? 'w-20' : 'w-72'}
        bg-gradient-to-b from-gray-50 to-white
        border-r border-gray-200
        shadow-xl
        transition-all duration-300 ease-in-out
        flex flex-col min-h-screen
      `}
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-primary-hover) 100%)`,
            }}
          >
            T
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">ThuLoBazaar</h1>
              <p
                className="text-xs font-semibold uppercase tracking-wider mt-0.5"
                style={{ color: 'var(--admin-primary)' }}
              >
                {roleLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-8">
            {!isCollapsed && (
              <div className="px-6 pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            <div className="space-y-1 px-3">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center gap-3 px-4 py-3.5 rounded-xl
                      transition-all duration-200
                      ${isCollapsed ? 'justify-center' : ''}
                      ${
                        isActive
                          ? 'font-semibold shadow-md'
                          : 'text-gray-600 hover:bg-white hover:shadow-sm hover:text-gray-900'
                      }
                      group
                    `}
                    style={
                      isActive
                        ? {
                            background: `linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-primary-hover) 100%)`,
                            color: 'white',
                          }
                        : undefined
                    }
                  >
                    {/* Icon */}
                    <span
                      className={`
                        text-2xl w-6 text-center flex-shrink-0
                        transition-transform duration-200
                        ${isActive ? '' : 'group-hover:scale-110'}
                      `}
                    >
                      {item.icon}
                    </span>

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-sm">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`
                              text-xs font-bold px-2.5 py-1 rounded-lg
                              ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                              }
                              min-w-[24px] text-center
                            `}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}

                    {/* Active Indicator Dot (collapsed mode) */}
                    {isCollapsed && isActive && (
                      <span
                        className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'var(--admin-primary)' }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''} p-2`}>
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg ring-2 ring-white"
            style={{
              background: `linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-primary-hover) 100%)`,
            }}
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full rounded-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold text-gray-900 text-sm truncate">{userName}</div>
              <div className="text-xs text-gray-500 truncate">{userEmail}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
