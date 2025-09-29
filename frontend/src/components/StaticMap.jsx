import { useState } from 'react';

function StaticMap({ latitude, longitude, width = 300, height = 200, zoom = 15, className = '', style = {} }) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!latitude || !longitude) {
    return (
      <div
        className={className}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          ...style
        }}
      >
        📍 Location not available
      </div>
    );
  }

  // Use OpenStreetMap static map service (free alternative)
  const osmStaticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+dc1e4a(${longitude},${latitude})/${longitude},${latitude},${zoom}/${width}x${height}?access_token=pk.YOUR_MAPBOX_TOKEN`;

  // Fallback to simple coordinate display
  const fallbackMapUrl = `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <rect x="10" y="10" width="${width-20}" height="${height-20}" fill="#e2e8f0" rx="8"/>
      <text x="50%" y="40%" text-anchor="middle" font-family="system-ui" font-size="14" fill="#64748b">📍 Location</text>
      <text x="50%" y="55%" text-anchor="middle" font-family="system-ui" font-size="12" fill="#94a3b8">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</text>
      <text x="50%" y="70%" text-anchor="middle" font-family="system-ui" font-size="11" fill="#cbd5e1">Click to view on map</text>
    </svg>
  `)}`;

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);
  };

  const handleClick = () => {
    // Open Google Maps in new tab
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        cursor: 'pointer',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        position: 'relative',
        ...style
      }}
      onClick={handleClick}
      title={`View location on map (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b'
        }}>
          🔄 Loading map...
        </div>
      )}

      <img
        src={imageError ? fallbackMapUrl : osmStaticMapUrl}
        alt={`Map showing location at ${latitude}, ${longitude}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: loading ? 'none' : 'block'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Overlay with location info */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '4px',
        right: '4px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        textAlign: 'center'
      }}>
        📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </div>
    </div>
  );
}

export default StaticMap;