import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AuthModal from './AuthModal';
import ApiService from '../services/api';

function SimpleHeader({ showUserWelcome = false }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const dropdownRef = useRef(null);

  const handlePostAdClick = () => {
    if (isAuthenticated) {
      navigate(`/${language}/post-ad`);
    } else {
      setAuthModal({ isOpen: true, mode: 'login' });
    }
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = path;
    }
    closeMobileMenu();
  };

  const handleLogoClick = () => {
    navigate(`/${language}`);
    setMobileMenuOpen(false);
  };

  // Fetch profile data when authenticated
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'super_admin' && user.role !== 'editor') {
      fetchProfile();
    }
  }, [isAuthenticated, user]);

  const fetchProfile = async () => {
    try {
      const data = await ApiService.getProfile();
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="header">
        <div className="top-header">
          <div className="top-header-content">
            {/* Logo */}
            <div className="logo" onClick={handleLogoClick} style={{cursor: 'pointer'}}>
              <img src="/logo.png" alt="Thulobazaar" className="logo-image" />
            </div>

            {/* Desktop Navigation */}
            <div className="desktop-nav">
              <button
                className="nav-link-btn all-ads-link"
                onClick={() => handleNavigation('/all-ads')}
              >
                All Ads
              </button>
              <div className="auth-buttons">
                {!isAuthenticated && (
                  <>
                    <button
                      className="signin-btn"
                      onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                    >
                      Sign In
                    </button>
                    <button
                      className="signup-btn"
                      onClick={() => setAuthModal({ isOpen: true, mode: 'register' })}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
              <button className="post-ad-btn" onClick={handlePostAdClick}>
                POST FREE AD
              </button>

              {/* Profile Dropdown */}
              {isAuthenticated && user?.role !== 'editor' && user?.role !== 'super_admin' && (
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <div
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      border: '2px solid #e2e8f0',
                      backgroundColor: '#3b82f6'
                    }}
                  >
                    {profileData?.avatar ? (
                      <img
                        src={`http://localhost:5000/uploads/avatars/${profileData.avatar}`}
                        alt={profileData.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        {getInitials(user?.fullName)}
                      </div>
                    )}
                  </div>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '50px',
                      right: '0',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      minWidth: '200px',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}>
                      {/* User Info */}
                      <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc'
                      }}>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                          {user?.fullName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {user?.email}
                        </div>
                      </div>

                      {/* Menu Items */}
                      <button
                        onClick={() => {
                          handleNavigation(`/${language}/profile`);
                          setProfileDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#334155',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        👤 My Profile
                      </button>

                      <button
                        onClick={() => {
                          handleNavigation(`/${language}/dashboard`);
                          setProfileDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#334155',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        📊 My Dashboard
                      </button>

                      <div style={{ borderTop: '1px solid #e2e8f0' }}>
                        <button
                          onClick={() => {
                            logout();
                            setProfileDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            backgroundColor: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#dc2626',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <div className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
            <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <img src="/logo.png" alt="Thulobazaar" className="mobile-logo" />
                <button
                  className="mobile-menu-close"
                  onClick={closeMobileMenu}
                  aria-label="Close mobile menu"
                >
                  ×
                </button>
              </div>

              <div className="mobile-menu-content">
                {/* Auth Section - Now First */}
                <div className="mobile-auth-section">
                  {isAuthenticated ? (
                    <div className="mobile-user-info">
                      <div className="mobile-welcome">
                        Welcome, {user?.fullName}!
                      </div>
                      <button
                        className="mobile-logout-btn"
                        onClick={() => { logout(); closeMobileMenu(); }}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="mobile-auth-buttons">
                      <button
                        className="mobile-signin-btn"
                        onClick={() => {
                          setAuthModal({ isOpen: true, mode: 'login' });
                          closeMobileMenu();
                        }}
                      >
                        Sign In
                      </button>
                      <button
                        className="mobile-signup-btn"
                        onClick={() => {
                          setAuthModal({ isOpen: true, mode: 'register' });
                          closeMobileMenu();
                        }}
                      >
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>

                {/* Navigation Links - Now styled like signup buttons */}
                <div className="mobile-nav-links">
                  <button
                    className="mobile-nav-btn"
                    onClick={() => handleNavigation('/')}
                  >
                    🏠 Home
                  </button>
                  <button
                    className="mobile-nav-btn"
                    onClick={() => handleNavigation('/all-ads')}
                  >
                    📋 All Ads
                  </button>

                  {isAuthenticated && (
                    <button
                      className="mobile-nav-btn"
                      onClick={() => handleNavigation('/dashboard')}
                    >
                      📊 Dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Floating Post Ad Button - Mobile Only */}
      <button
        className="floating-post-ad-btn"
        onClick={handlePostAdClick}
        aria-label="Post Free Ad"
      >
        <div className="floating-btn-icon">
          <svg viewBox="0 0 18 18" className="floating-btn-svg">
            <path d="M9 1C4.6 1 1 4.6 1 9s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm4.6 9.3h-3.4v3.4H7.9v-3.4H4.4V8h3.4V4.6h2.3V8h3.4l.1 2.3z" fillRule="evenodd" clipRule="evenodd"/>
          </svg>
        </div>
        <span className="floating-btn-text">POST FREE AD</span>
      </button>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
        onSwitchMode={(mode) => setAuthModal({ isOpen: true, mode })}
      />
    </>
  );
}

export default SimpleHeader;