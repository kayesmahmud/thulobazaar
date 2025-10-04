import { styles, colors, spacing, typography } from '../../styles/theme';

/**
 * LoadingState component - Displays various loading states
 * @param {string} variant - Type of loading: 'spinner', 'skeleton', 'inline', 'overlay', 'dots'
 * @param {string} size - Size: 'small', 'medium', 'large'
 * @param {string} message - Optional loading message
 * @param {boolean} fullScreen - Show as full screen overlay
 */
function LoadingState({
  variant = 'spinner',
  size = 'medium',
  message = 'Loading...',
  fullScreen = false
}) {
  const sizes = {
    small: '24px',
    medium: '48px',
    large: '72px'
  };

  const spinnerSize = sizes[size];

  // Spinner variant
  const SpinnerLoader = () => (
    <div style={{
      textAlign: 'center',
      padding: spacing.xl
    }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `4px solid ${colors.background.tertiary}`,
          borderTop: `4px solid ${colors.primary}`,
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && (
        <p style={{
          marginTop: spacing.md,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          {message}
        </p>
      )}
    </div>
  );

  // Dots variant
  const DotsLoader = () => (
    <div style={{
      textAlign: 'center',
      padding: spacing.xl
    }}>
      <div style={{
        display: 'flex',
        gap: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: size === 'small' ? '8px' : size === 'large' ? '16px' : '12px',
              height: size === 'small' ? '8px' : size === 'large' ? '16px' : '12px',
              borderRadius: '50%',
              backgroundColor: colors.primary,
              animation: `bounce 1.4s infinite ease-in-out`,
              animationDelay: `${i * 0.16}s`
            }}
          />
        ))}
      </div>
      {message && (
        <p style={{
          marginTop: spacing.md,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          {message}
        </p>
      )}
    </div>
  );

  // Inline variant (for buttons)
  const InlineLoader = () => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: spacing.sm
    }}>
      <div
        style={{
          width: '16px',
          height: '16px',
          border: `2px solid currentColor`,
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && <span>{message}</span>}
    </span>
  );

  // Skeleton variant (for content placeholders)
  const SkeletonLoader = () => (
    <div style={{ padding: spacing.lg }}>
      {[1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            height: size === 'small' ? '40px' : size === 'large' ? '80px' : '60px',
            backgroundColor: colors.background.tertiary,
            borderRadius: '8px',
            marginBottom: spacing.md,
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </div>
  );

  // Overlay variant
  const OverlayLoader = () => (
    <div style={{
      position: fullScreen ? 'fixed' : 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        textAlign: 'center',
        padding: spacing.xl,
        ...styles.card.elevated
      }}>
        <div
          style={{
            width: spinnerSize,
            height: spinnerSize,
            border: `4px solid ${colors.background.tertiary}`,
            borderTop: `4px solid ${colors.primary}`,
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}
        />
        {message && (
          <p style={{
            marginTop: spacing.md,
            fontSize: typography.fontSize.base,
            color: colors.text.primary,
            fontWeight: typography.fontWeight.medium
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );

  // Render based on variant
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'inline':
        return <InlineLoader />;
      case 'skeleton':
        return <SkeletonLoader />;
      case 'overlay':
        return <OverlayLoader />;
      case 'spinner':
      default:
        return <SpinnerLoader />;
    }
  };

  return (
    <>
      {renderLoader()}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

// Convenience export for common loading scenarios
export const LoadingSpinner = (props) => <LoadingState variant="spinner" {...props} />;
export const LoadingDots = (props) => <LoadingState variant="dots" {...props} />;
export const LoadingInline = (props) => <LoadingState variant="inline" {...props} />;
export const LoadingSkeleton = (props) => <LoadingState variant="skeleton" {...props} />;
export const LoadingOverlay = (props) => <LoadingState variant="overlay" {...props} />;

export default LoadingState;
