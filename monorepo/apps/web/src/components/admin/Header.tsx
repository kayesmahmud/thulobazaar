'use client';

import { useState } from 'react';

interface HeaderProps {
  onSidebarToggle?: () => void;
  searchPlaceholder?: string;
  systemAlert?: {
    message: string;
    type?: 'warning' | 'info' | 'error';
  };
  notificationCount?: number;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onLogout?: () => void | Promise<void>;
}

export function Header({
  onSidebarToggle,
  searchPlaceholder = 'Quick search across platform...',
  systemAlert,
  notificationCount = 0,
  userName,
  userEmail,
  userAvatar,
  onLogout,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const alertColors = {
    warning: 'bg-warning/10 text-warning',
    info: 'bg-blue-100 text-blue-600',
    error: 'bg-red-100 text-red-600',
  };

  return (
    <header className="h-[70px] bg-white shadow-md flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onSidebarToggle}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <span className="text-xl">☰</span>
        </button>

        {/* Search Bar */}
        <div className="relative w-[400px] max-md:w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:border-primary focus:bg-white focus:ring-3 focus:ring-primary/10
                     transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* System Alert */}
        {systemAlert && (
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              ${alertColors[systemAlert.type || 'warning']}
            `}
          >
            <span>⚠️</span>
            <span>{systemAlert.message}</span>
          </div>
        )}

        {/* Notification Bell */}
        <button
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <span className="text-xl">🔔</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* User Profile & Logout */}
        {userName && (
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                style={{ backgroundColor: 'var(--admin-primary)' }}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-full h-full rounded-full" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block">
                <div className="font-semibold text-gray-900 text-sm">{userName}</div>
                {userEmail && <div className="text-xs text-gray-500">{userEmail}</div>}
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--admin-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--admin-primary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--admin-primary)';
                }}
                title="Logout"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
