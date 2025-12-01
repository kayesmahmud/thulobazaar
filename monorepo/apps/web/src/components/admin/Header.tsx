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
  theme?: 'editor' | 'superadmin';
  showDashboardButton?: boolean;
  lastLogin?: string | null;
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
  theme = 'superadmin',
  showDashboardButton = false,
  lastLogin,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const alertColors = {
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: '⚠️',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: 'ℹ️',
    },
    error: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: '❌',
    },
  };

  const alert = systemAlert ? alertColors[systemAlert.type || 'warning'] : null;

  return (
    <header className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onSidebarToggle}
          className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search Bar */}
        <div className="relative w-[420px] max-md:w-[220px]">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={searchPlaceholder}
            className={`
              w-full pl-11 pr-4 py-2.5
              bg-gray-50 border-2 rounded-xl text-sm
              focus:outline-none focus:bg-white
              transition-all duration-200
              ${isSearchFocused
                ? 'border-emerald-400 ring-4 ring-emerald-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Last Login */}
        {lastLogin !== undefined && (
          <div className="hidden md:block text-right mr-2">
            <p className="text-xs text-gray-500">Last Login:</p>
            <p className="text-sm font-bold text-gray-900">
              {lastLogin
                ? new Date(lastLogin).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Never'}
            </p>
          </div>
        )}

        {/* System Alert */}
        {systemAlert && alert && (
          <div
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              ${alert.bg} ${alert.text}
            `}
          >
            <span className="text-base">{alert.icon}</span>
            <span className="max-w-[200px] truncate">{systemAlert.message}</span>
          </div>
        )}

        {/* Notification Bell */}
        <button
          className="relative p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* Export Report Button */}
        <button className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Report</span>
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName || 'User'}
                className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {userName?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <div className="text-sm font-semibold text-gray-900">{userName || 'Admin'}</div>
              <div className="text-xs text-gray-500">{userEmail || 'admin@example.com'}</div>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-900">{userName || 'Admin'}</div>
                  <div className="text-xs text-gray-500">{userEmail || 'admin@example.com'}</div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout?.();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
