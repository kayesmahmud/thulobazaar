import React from 'react';

function ErrorMessage({ error, onClose }) {
  if (!error) return null;

  // Check if error has structured information
  const isStructured = error.structured || (error.type && error.title);

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'high':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          textColor: '#dc2626'
        };
      case 'medium':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#fcd34d',
          textColor: '#d97706'
        };
      case 'low':
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#93c5fd',
          textColor: '#2563eb'
        };
      default:
        return {
          backgroundColor: '#fee2e2',
          borderColor: '#fecaca',
          textColor: '#dc2626'
        };
    }
  };

  const style = getSeverityStyle(error.severity);

  return (
    <div style={{
      backgroundColor: style.backgroundColor,
      border: `1px solid ${style.borderColor}`,
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      position: 'relative'
    }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: style.textColor,
            opacity: 0.7
          }}
        >
          ×
        </button>
      )}

      {isStructured ? (
        <div>
          {/* Title */}
          <div style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: style.textColor,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {error.severity === 'high' && '🚫'}
            {error.severity === 'medium' && '⚠️'}
            {error.severity === 'low' && 'ℹ️'}
            {error.title || 'Error'}
          </div>

          {/* Main message */}
          <div style={{
            color: style.textColor,
            marginBottom: '12px',
            lineHeight: '1.5'
          }}>
            {error.message}
          </div>

          {/* Suggestion */}
          {error.suggestion && (
            <div style={{
              color: style.textColor,
              fontSize: '14px',
              fontStyle: 'italic',
              opacity: 0.9,
              borderTop: `1px solid ${style.borderColor}`,
              paddingTop: '8px'
            }}>
              💡 {error.suggestion}
            </div>
          )}
        </div>
      ) : (
        // Fallback for non-structured errors
        <div style={{
          color: style.textColor,
          lineHeight: '1.5'
        }}>
          {error.message || error.toString()}
        </div>
      )}
    </div>
  );
}

export default ErrorMessage;