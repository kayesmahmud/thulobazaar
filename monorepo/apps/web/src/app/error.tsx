'use client';

/**
 * Error Boundary for Next.js 15
 * Catches errors in Server and Client Components
 * 2025 Best Practice: Always provide error.tsx for better UX
 */

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, etc.)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#991b1b'
        }}>
          ⚠️ Something went wrong!
        </h2>

        <p style={{
          color: '#7f1d1d',
          marginBottom: '1.5rem'
        }}>
          {error.message || 'An unexpected error occurred'}
        </p>

        {error.digest && (
          <p style={{
            fontSize: '0.875rem',
            color: '#991b1b',
            marginBottom: '1.5rem',
            fontFamily: 'monospace'
          }}>
            Error ID: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          style={{
            background: '#dc2626',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
          onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
