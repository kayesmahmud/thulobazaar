import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

function SimpleHeader({ showUserWelcome = false }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePostAdClick = () => {
    if (isAuthenticated) {
      navigate('/post-ad');
    } else {
      setAuthModal({ isOpen: true, mode: 'login' });
    }
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path, event = null) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to direct window navigation if React Router fails
      window.location.href = path;
    }
    closeMobileMenu();
  };

  return (
    <>
      <header className="header">
        <div className="top-header">
          <div className="top-header-content">
            {/* Logo */}
            <div className="logo">
              <a href="/" onClick={(e) => handleNavigation('/', e)}>
                <img src="/logo.png" alt="Thulobazaar" className="logo-image" />
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="desktop-nav">
              <a href="/all-ads" className="all-ads-link" onClick={(e) => { e.preventDefault(); handleNavigation('/all-ads'); }}>
                All Ads
              </a>
              <div className="auth-buttons">
                {isAuthenticated ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {showUserWelcome && (
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        Welcome, {user?.fullName}!
                      </span>
                    )}
                    <button
                      className="signin-btn"
                      onClick={() => handleNavigation('/dashboard')}
                      style={{ backgroundColor: '#3b82f6' }}
                    >
                      Dashboard
                    </button>
                    <button
                      className="signin-btn"
                      onClick={() => { logout(); closeMobileMenu(); }}
                      style={{ backgroundColor: '#64748b' }}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
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
                    onClick={(e) => handleNavigation('/', e)}
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