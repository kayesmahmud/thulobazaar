// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

interface HeaderProps {
  lang: string;
}

export default function Header({ lang }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check both user and staff auth
  const { user, isAuthenticated: isUserAuthenticated, logout: userLogout } = useUserAuth();
  const { staff, isAuthenticated: isStaffAuthenticated, logout: staffLogout } = useStaffAuth();

  // Determine which user is logged in
  const currentUser = staff || user;
  const isAuthenticated = isStaffAuthenticated || isUserAuthenticated;
  const logout = staff ? staffLogout : userLogout;

  const handleSignOut = async () => {
    await logout();
    setProfileDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Role-based styling
  const getRoleBadgeColor = () => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 'super_admin':
        return 'bg-red-600 text-white';
      case 'editor':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getRoleLabel = () => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 'super_admin':
        return 'Super Admin';
      case 'editor':
        return 'Editor';
      default:
        return 'User';
    }
  };

  // Check if user is staff (editor or super_admin)
  const isStaff = currentUser?.role === 'editor' || currentUser?.role === 'super_admin';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-desktop mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${lang}`}
            className="no-underline flex items-center hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl font-bold text-primary">
              Thulobazaar
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden tablet:flex items-center gap-6">
            {!isStaff && (
              <>
                <Link
                  href={`/${lang}/all-ads`}
                  className={`no-underline font-medium text-sm ${
                    pathname?.includes('/all-ads') ? 'text-primary' : 'text-gray-600 hover:text-primary'
                  } transition-colors`}
                >
                  All Ads
                </Link>

                <Link
                  href={`/${lang}/search`}
                  className={`no-underline font-medium text-sm ${
                    pathname?.includes('/search') ? 'text-primary' : 'text-gray-600 hover:text-primary'
                  } transition-colors`}
                >
                  Search
                </Link>
              </>
            )}

            {!isAuthenticated ? (
              <>
                <Link
                  href={`/${lang}/auth/login`}
                  className="btn-outline-primary text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href={`/${lang}/auth/register`}
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
                <Link
                  href={`/${lang}/post-ad`}
                  className="bg-success hover:bg-success-hover text-white px-6 py-2.5 rounded-lg no-underline font-semibold text-sm transition-colors"
                >
                  + POST FREE AD
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {/* Staff Interface (Editors & Super Admins) */}
                {isStaff ? (
                  <>
                    {/* Role-based dashboard links */}
                    {currentUser?.role === 'super_admin' ? (
                      <Link
                        href={`/${lang}/super-admin/dashboard`}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-purple-700 transition-all"
                      >
                        <span>🛡️</span>
                        Super Admin Panel
                      </Link>
                    ) : (
                      <Link
                        href={`/${lang}/editor/dashboard`}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold text-sm hover:from-green-600 hover:to-emerald-700 transition-all"
                      >
                        <span>✍️</span>
                        Editor Panel
                      </Link>
                    )}

                    {/* User info with role badge */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getRoleBadgeColor()}`}>
                        {getRoleLabel()}
                      </span>
                      <span className="text-gray-600 text-sm font-medium">
                        {currentUser?.fullName || currentUser?.email}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Regular User Interface with Avatar Dropdown */}
                    <Link
                      href={`/${lang}/post-ad`}
                      className="bg-success hover:bg-success-hover text-white px-6 py-2.5 rounded-lg no-underline font-semibold text-sm transition-colors"
                    >
                      + POST FREE AD
                    </Link>

                    {/* Profile Avatar Dropdown */}
                    <div ref={dropdownRef} className="relative">
                      <button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer p-0"
                        aria-label="Profile menu"
                        aria-expanded={profileDropdownOpen}
                        aria-haspopup="true"
                      >
                        {user?.avatar ? (
                          <img
                            src={`/uploads/avatars/${user.avatar}`}
                            alt={user?.fullName || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold text-sm">
                            {getInitials(user?.fullName)}
                          </div>
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      {profileDropdownOpen && (
                        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg min-w-[200px] z-50 overflow-hidden border border-gray-100">
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <div className="font-semibold text-gray-900 text-sm">
                              {user?.fullName}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {user?.email}
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <Link
                              href={`/${lang}/profile`}
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 no-underline transition-colors"
                            >
                              👤 My Profile
                            </Link>

                            <Link
                              href={`/${lang}/dashboard`}
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 no-underline transition-colors"
                            >
                              📊 My Dashboard
                            </Link>

                            {/* View My Shop - if user has shop slug */}
                            {user && user?.shopSlug && (
                              <Link
                                href={`/${lang}/shop/${user.shopSlug}`}
                                onClick={() => setProfileDropdownOpen(false)}
                                className={`block w-full px-4 py-2.5 text-left text-sm font-medium no-underline transition-colors ${
                                  user?.accountType === 'business' && user?.businessVerificationStatus === 'approved'
                                    ? 'text-yellow-600 hover:bg-yellow-50'
                                    : user?.individualVerified
                                    ? 'text-blue-600 hover:bg-blue-50'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                🏪 View My Shop
                              </Link>
                            )}
                          </div>

                          {/* Sign Out */}
                          <div className="border-t border-gray-100">
                            <button
                              onClick={handleSignOut}
                              className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              🚪 Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="tablet:hidden p-2 text-gray-600 hover:text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="tablet:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              {!isStaff && (
                <>
                  <Link href={`/${lang}/all-ads`} className="text-gray-600 hover:text-primary py-2">
                    All Ads
                  </Link>
                  <Link href={`/${lang}/search`} className="text-gray-600 hover:text-primary py-2">
                    Search
                  </Link>
                </>
              )}

              {!isAuthenticated ? (
                <>
                  <Link href={`/${lang}/auth/login`} className="btn-outline-primary w-full text-center">
                    Sign In
                  </Link>
                  <Link href={`/${lang}/auth/register`} className="btn-primary w-full text-center">
                    Sign Up
                  </Link>
                  <Link href={`/${lang}/post-ad`} className="bg-success text-white py-3 rounded-lg text-center font-semibold">
                    + POST FREE AD
                  </Link>
                </>
              ) : (
                <>
                  {currentUser?.role === 'super_admin' ? (
                    <Link href={`/${lang}/super-admin/dashboard`} className="btn-primary w-full text-center">
                      🛡️ Super Admin Panel
                    </Link>
                  ) : currentUser?.role === 'editor' ? (
                    <Link href={`/${lang}/editor/dashboard`} className="btn-primary w-full text-center">
                      ✍️ Editor Panel
                    </Link>
                  ) : (
                    <Link href={`/${lang}/dashboard`} className="text-gray-600 hover:text-primary py-2">
                      Dashboard
                    </Link>
                  )}

                  {/* Only show Sign Out for regular users (not staff) in mobile */}
                  {!isStaff && (
                    <button onClick={handleSignOut} className="btn-outline-danger w-full">
                      Sign Out
                    </button>
                  )}

                  {/* Only show Post Ad for regular users in mobile */}
                  {!isStaff && (
                    <Link href={`/${lang}/post-ad`} className="bg-success text-white py-3 rounded-lg text-center font-semibold">
                      + POST FREE AD
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
