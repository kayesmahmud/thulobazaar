/**
 * Global Loading State
 * Next.js 15 Best Practice: Provide loading.tsx for better UX during navigation
 */

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      padding: '2rem'
    }}>
      {/* Spinner */}
      <div className="spinner" style={{
        width: '48px',
        height: '48px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%'
      }} />

      <p style={{
        marginTop: '1rem',
        color: '#6b7280',
        fontSize: '1rem'
      }}>
        Loading...
      </p>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner {
            animation: spin 1s linear infinite;
          }
        `
      }} />
    </div>
  );
}
