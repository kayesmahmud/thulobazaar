'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
  userName = 'Admin User',
  userEmail = 'admin@thulobazaar.com',
  userAvatar,
  isCollapsed = false,
  navSections,
  theme = 'superadmin',
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        ${isCollapsed ? 'w-20' : 'w-64'}
        bg-white shadow-lg transition-all duration-300 ease-in-out
        flex flex-col h-screen sticky top-0
      `}
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
          style={{ backgroundColor: 'var(--admin-primary)' }}
        >
          T
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-xl font-bold text-gray-900">ThuLoBazaar</h1>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!isCollapsed && (
              <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex items-center gap-3 px-6 py-3
                    transition-all duration-200
                    ${isCollapsed ? 'justify-center' : ''}
                    ${
                      isActive
                        ? 'font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  style={
                    isActive
                      ? {
                          color: 'var(--admin-primary)',
                        }
                      : undefined
                  }
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                      style={{ backgroundColor: 'var(--admin-primary)' }}
                    />
                  )}
                  <span className="text-xl w-5 text-center flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-warning text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
            style={{ backgroundColor: 'var(--admin-primary)' }}
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full rounded-full" />
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
