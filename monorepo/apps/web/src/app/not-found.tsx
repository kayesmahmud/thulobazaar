/**
 * 404 Not Found Page
 * Next.js 15 Best Practice: Provide custom 404 page
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{
          fontSize: '6rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: '600',
          marginBottom: '1rem',
          color: '#1f2937'
        }}>
          Page Not Found
        </h2>

        <p style={{
          color: '#6b7280',
          marginBottom: '2rem',
          fontSize: '1.125rem'
        }}>
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          The page might have been moved or deleted.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/en"
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
