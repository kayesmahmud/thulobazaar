import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function EditorHeader() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleNavigation = (path) => {
    navigate(`/${language}${path}`);
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
    if (!name) return 'E';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="header">
      <div className="top-header">
        <div className="top-header-content">
          {/* Logo */}
          <Link to={`/${language}`} className="logo" style={{cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center'}}>
            <img src="/logo.png" alt="Thulobazaar" className="logo-image" />
          </Link>

          {/* Desktop Navigation */}
          <div className="desktop-nav">
            <button
              className="post-ad-btn"
              onClick={() => handleNavigation('/editor')}
              style={{ marginRight: '16px' }}
            >
              🛡️ EDITOR PANEL
            </button>

            {/* Profile Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="Profile menu"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  border: '2px solid #6b21a8',
                  backgroundColor: '#6b21a8',
                  padding: 0
                }}
              >
                {user?.avatar ? (
                  <img
                    src={`http://localhost:5000/uploads/avatars/${user.avatar}`}
                    alt={user.fullName}
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
              </button>

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
                    backgroundColor: '#f3e8ff'
                  }}>
                    <div style={{ fontWeight: '600', color: '#6b21a8', fontSize: '14px' }}>
                      {user?.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7c3aed', marginTop: '2px' }}>
                      Editor
                    </div>
                  </div>

                  {/* Editor Panel Link */}
                  <button
                    onClick={() => {
                      handleNavigation('/editor');
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
                      color: '#6b21a8',
                      fontWeight: '600',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3e8ff'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    🛡️ Editor Panel
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
          </div>
        </div>
      </div>
    </header>
  );
}

export default EditorHeader;
