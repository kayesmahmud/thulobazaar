import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/api';

function AuthModal({ isOpen, onClose, mode, onAuthSuccess }) {
  const { login, register } = useAuth();
  const [formMode, setFormMode] = useState(mode || 'login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync formMode with mode prop
  useEffect(() => {
    if (mode) {
      setFormMode(mode);
    }
  }, [mode]);


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (formMode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData);
      }

      console.log(`✅ ${formMode} successful:`, result);
      if (onAuthSuccess) onAuthSuccess(result);
      onClose();
    } catch (err) {
      console.error(`❌ ${formMode} error:`, err);
      setError(err.message || `${formMode} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setFormMode(formMode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phone: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        margin: '20px',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            color: '#1e293b',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {formMode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p style={{
            margin: 0,
            color: '#64748b',
            fontSize: '14px'
          }}>
            {formMode === 'login'
              ? 'Welcome back to Thulobazaar'
              : 'Join Thulobazaar to post ads'
            }
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {formMode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Enter your password"
            />
          </div>

          {formMode === 'register' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="+977-9800000000"
                />
              </div>

            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#94a3b8' : '#dc1e4a',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {loading ? '⏳ Please wait...' : (formMode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>
            {formMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={switchMode}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc1e4a',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              {formMode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;