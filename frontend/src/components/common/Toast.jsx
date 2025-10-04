import { createContext, useContext, useState, useCallback } from 'react';
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
  const getToastStyle = () => {
    const baseStyle = {
      padding: spacing.lg,
      borderRadius: '8px',
      boxShadow: shadows.lg,
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing.md,
      minWidth: '300px',
      maxWidth: '500px',
      animation: 'slideIn 0.3s ease-out',
      backgroundColor: colors.background.primary,
      border: `1px solid ${colors.border.default}`
    };

    const iconStyles = {
      success: { icon: '✅', color: colors.success, bg: '#d1fae5' },
      error: { icon: '❌', color: colors.error, bg: '#fee2e2' },
      warning: { icon: '⚠️', color: '#f59e0b', bg: '#fef3c7' },
      info: { icon: 'ℹ️', color: colors.secondary, bg: '#dbeafe' }
    };

    const style = iconStyles[toast.type] || iconStyles.info;

    return { ...baseStyle, borderLeft: `4px solid ${style.color}` };
  };

  const getIcon = () => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[toast.type] || icons.info;
  };

  return (
    <div style={getToastStyle()}>
      <div style={{ fontSize: '24px', lineHeight: 1 }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1 }}>
        {toast.title && (
          <div style={{
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: spacing.xs
          }}>
            {toast.title}
          </div>
        )}
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          lineHeight: 1.5
        }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: colors.text.muted,
          padding: 0,
          lineHeight: 1
        }}
      >
        ×
      </button>
    </div>
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

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: spacing.xl,
        right: spacing.xl,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
