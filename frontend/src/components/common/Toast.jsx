import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { colors, spacing, typography, shadows } from '../../styles/theme';

const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 50);

    // Start exit animation before auto-close
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration - 300);

    return () => clearTimeout(exitTimer);
  }, [toast.id, toast.duration, onClose]);

  const getToastStyle = () => {
    const iconStyles = {
      success: {
        icon: '✓',
        bgColor: '#10b981',
        iconBg: '#ffffff',
        iconColor: '#10b981'
      },
      error: {
        icon: '✕',
        bgColor: '#ef4444',
        iconBg: '#ffffff',
        iconColor: '#ef4444'
      },
      warning: {
        icon: '⚠',
        bgColor: '#f59e0b',
        iconBg: '#ffffff',
        iconColor: '#f59e0b'
      },
      info: {
        icon: 'ℹ',
        bgColor: '#3b82f6',
        iconBg: '#ffffff',
        iconColor: '#3b82f6'
      }
    };

    return iconStyles[toast.type] || iconStyles.info;
  };

  const style = getToastStyle();

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          opacity: isVisible && !isExiting ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: isVisible && !isExiting ? 'auto' : 'none'
        }}
        onClick={handleClose}
      />

      {/* Toast popup - centered like mobile app */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${isVisible && !isExiting ? 1 : 0.7})`,
          zIndex: 9999,
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '32px 24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          minWidth: '280px',
          maxWidth: '90%',
          width: 'auto',
          textAlign: 'center',
          opacity: isVisible && !isExiting ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          pointerEvents: 'auto'
        }}
      >
        {/* Large Icon Circle */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: style.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: isVisible && !isExiting ? 'scaleInPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none'
          }}
        >
          <div
            style={{
              fontSize: '40px',
              fontWeight: 'bold',
              color: 'white'
            }}
          >
            {style.icon}
          </div>
        </div>

        {/* Title */}
        {toast.title && (
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#1f2937'
          }}>
            {toast.title}
          </h3>
        )}

        {/* Message */}
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '16px',
          color: '#6b7280',
          lineHeight: 1.6
        }}>
          {toast.message}
        </p>

        {/* OK Button */}
        <button
          onClick={handleClose}
          style={{
            backgroundColor: style.bgColor,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 48px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          OK
        </button>
      </div>
    </>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      title: options.title,
      duration: options.duration || 5000
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (message, options) => addToast(message, 'success', options),
    error: (message, options) => addToast(message, 'error', options),
    warning: (message, options) => addToast(message, 'warning', options),
    info: (message, options) => addToast(message, 'info', options),
    custom: addToast,
    remove: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container - Only show latest toast */}
      {toasts.length > 0 && (
        <ToastItem
          key={toasts[toasts.length - 1].id}
          toast={toasts[toasts.length - 1]}
          onClose={removeToast}
        />
      )}

      <style>{`
        @keyframes scaleInPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
