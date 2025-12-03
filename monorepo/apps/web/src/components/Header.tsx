// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${lang}`}
            className="no-underline flex items-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="Thulobazaar"
              width={84}
              height={40}
              className="h-10 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {!isStaff && (
              <>
                <Link
                  href={`/${lang}/all-ads`}
                  className={`no-underline font-medium text-sm ${
                    pathname?.includes('/all-ads') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-500'
                  } transition-colors`}
                >
                  All Ads
                </Link>

                <Link
                  href={`/${lang}/search`}
                  className={`no-underline font-medium text-sm ${
                    pathname?.includes('/search') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-500'
                  } transition-colors`}
                >
                  Search
                </Link>
              </>
            )}

            {!isAuthenticated ? (
              <>
                <Link
                  href={`/${lang}/auth/signin`}
                  className="px-4 py-2 rounded-lg font-semibold border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href={`/${lang}/auth/register`}
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors text-sm"
                >
                  Sign Up
                </Link>
                <Link
                  href={`/${lang}/post-ad`}
                  className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-105"
                >
                  {/* Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                  {/* Button Content */}
                  <div className="relative flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span>POST FREE AD</span>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                  </div>
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
                        className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-all duration-200 text-center"
                      >
                        Editor Dashboard
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    {/* Regular User Interface with Avatar Dropdown */}
                    <Link
                      href={`/${lang}/post-ad`}
                      className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-105"
                    >
                      {/* Glow Effect */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                      {/* Button Content */}
                      <div className="relative flex items-center gap-2">
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span>POST FREE AD</span>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                      </div>
                    </Link>

                    {/* Profile Avatar Dropdown */}
                    <div ref={dropdownRef} className="relative">
                      <button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-rose-500 transition-colors cursor-pointer p-0"
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
                          <div className="w-full h-full flex items-center justify-center bg-rose-500 text-white font-bold text-sm">
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

                            {/* View My Shop - for all users with shop slug */}
                            {user && (user.customShopSlug || user.shopSlug) && (
                              <Link
                                href={`/${lang}/shop/${user.customShopSlug || user.shopSlug}`}
                                onClick={() => setProfileDropdownOpen(false)}
                                className={`block w-full px-4 py-2.5 text-left text-sm font-medium no-underline transition-colors ${
                                  (user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified')
                                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 border-l-4 border-purple-500'
                                    : user.individualVerified
                                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 hover:from-blue-100 hover:to-cyan-100 border-l-4 border-blue-500'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    🏪 My Shop
                                  </span>
                                  {(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified') && (
                                    <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full font-bold">
                                      ⭐ VERIFIED
                                    </span>
                                  )}
                                  {user.individualVerified && !(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified') && (
                                    <span className="text-xs bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-2 py-0.5 rounded-full font-bold">
                                      ✓ VERIFIED
                                    </span>
                                  )}
                                </div>
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
            className="md:hidden p-2 text-gray-600 hover:text-rose-500"
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
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              {!isStaff && (
                <>
                  <Link href={`/${lang}/all-ads`} className="text-gray-600 hover:text-rose-500 py-2">
                    All Ads
                  </Link>
                  <Link href={`/${lang}/search`} className="text-gray-600 hover:text-rose-500 py-2">
                    Search
                  </Link>
                </>
              )}

              {!isAuthenticated ? (
                <>
                  <Link href={`/${lang}/auth/signin`} className="px-4 py-2 rounded-lg font-semibold border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors w-full text-center">
                    Sign In
                  </Link>
                  <Link href={`/${lang}/auth/register`} className="px-4 py-2 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors w-full text-center">
                    Sign Up
                  </Link>
                  <Link
                    href={`/${lang}/post-ad`}
                    className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold text-sm w-full hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative flex items-center gap-2">
                      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span>POST FREE AD</span>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  {currentUser?.role === 'super_admin' ? (
                    <Link href={`/${lang}/super-admin/dashboard`} className="px-4 py-2 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors w-full text-center">
                      🛡️ Super Admin Panel
                    </Link>
                  ) : currentUser?.role === 'editor' ? (
                    <Link href={`/${lang}/editor/dashboard`} className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-all duration-200 w-full text-center">
                      Editor Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link href={`/${lang}/profile`} className="text-gray-600 hover:text-rose-500 py-2">
                        👤 My Profile
                      </Link>
                      <Link href={`/${lang}/dashboard`} className="text-gray-600 hover:text-rose-500 py-2">
                        📊 Dashboard
                      </Link>

                      {/* My Shop - for all users with shop slug */}
                      {user && (user.customShopSlug || user.shopSlug) && (
                        <Link
                          href={`/${lang}/shop/${user.customShopSlug || user.shopSlug}`}
                          className={`py-2 font-medium flex items-center justify-between px-3 rounded-lg ${
                            (user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified')
                              ? 'text-purple-600 hover:text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500'
                              : user.individualVerified
                              ? 'text-blue-600 hover:text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500'
                              : 'text-gray-600 hover:text-rose-500'
                          }`}
                        >
                          <span>🏪 My Shop</span>
                          {(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified') && (
                            <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full font-bold">
                              ⭐ VERIFIED
                            </span>
                          )}
                          {user.individualVerified && !(user.businessVerificationStatus === 'approved' || user.businessVerificationStatus === 'verified') && (
                            <span className="text-xs bg-gradient-to-r from-blue-400 to-cyan-400 text-white px-2 py-0.5 rounded-full font-bold">
                              ✓ VERIFIED
                            </span>
                          )}
                        </Link>
                      )}
                    </>
                  )}

                  {/* Only show Sign Out for regular users (not staff) in mobile */}
                  {!isStaff && (
                    <button onClick={handleSignOut} className="btn-outline-danger w-full">
                      Sign Out
                    </button>
                  )}

                  {/* Only show Post Ad for regular users in mobile */}
                  {!isStaff && (
                    <Link
                      href={`/${lang}/post-ad`}
                      className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold text-sm w-full hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                      <div className="relative flex items-center gap-2">
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span>POST FREE AD</span>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                      </div>
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
