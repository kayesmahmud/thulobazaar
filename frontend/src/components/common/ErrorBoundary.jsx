import { Component } from 'react';
import { styles, colors, spacing, typography } from '../../styles/theme';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // TODO: Send error to logging service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl
        }}>
          <div style={{
            ...styles.card.default,
            maxWidth: '600px',
            textAlign: 'center',
            padding: spacing['2xl']
          }}>
            {/* Error Icon */}
            <div style={{
              fontSize: '64px',
              marginBottom: spacing.lg
            }}>
              ⚠️
            </div>

            {/* Error Title */}
            <h2 style={{
              ...styles.heading.h2,
              color: colors.error,
              marginBottom: spacing.md
            }}>
              {this.props.title || 'Oops! Something went wrong'}
            </h2>

            {/* Error Message */}
            <p style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              marginBottom: spacing.xl,
              lineHeight: 1.6
            }}>
              {this.props.message ||
                'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.'}
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                textAlign: 'left',
                marginBottom: spacing.xl,
                padding: spacing.lg,
                backgroundColor: colors.background.secondary,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: typography.fontWeight.semibold,
                  marginBottom: spacing.sm,
                  color: colors.text.primary
                }}>
                  Error Details (Development)
                </summary>
                <div style={{
                  marginTop: spacing.md,
                  fontFamily: 'monospace',
                  fontSize: typography.fontSize.xs,
                  color: colors.error
                }}>
                  <strong>Error:</strong> {this.state.error.toString()}
                  <br /><br />
                  <strong>Stack Trace:</strong>
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    marginTop: spacing.sm,
                    padding: spacing.md,
                    backgroundColor: colors.background.tertiary,
                    borderRadius: '4px',
                    overflow: 'auto'
                  }}>
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: spacing.md,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  ...styles.button.secondary,
                  minWidth: '140px'
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  ...styles.button.primary,
                  minWidth: '140px'
                }}
              >
                Reload Page
              </button>
              {this.props.onReset && (
                <button
                  onClick={this.props.onReset}
                  style={{
                    ...styles.button.ghost,
                    minWidth: '140px'
                  }}
                >
                  Go Back
                </button>
              )}
            </div>

            {/* Error Count Warning */}
            {this.state.errorCount > 2 && (
              <div style={{
                marginTop: spacing.lg,
                padding: spacing.md,
                backgroundColor: '#fef3c7',
                borderLeft: `4px solid ${colors.error}`,
                borderRadius: '4px',
                fontSize: typography.fontSize.sm,
                color: '#92400e'
              }}>
                ⚠️ Multiple errors detected ({this.state.errorCount}).
                Please reload the page or contact support.
              </div>
            )}
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
