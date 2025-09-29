import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker for ads
const createAdMarker = (color = '#dc1e4a') => {
  return new L.DivIcon({
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
    ">📍</div>`,
    className: 'custom-ad-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

// Component to update map center when coordinates change
function MapUpdater({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

function InteractiveMap({
  ads = [],
  center = [27.7172, 85.3240], // Default to Kathmandu
  zoom = 12,
  height = '400px',
  onAdClick = null,
  className = '',
  style = {}
}) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleMarkerClick = (ad) => {
    if (onAdClick) {
      onAdClick(ad);
    }
  };

  return (
    <div
      className={className}
      style={{
        height,
        width: '100%',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={center} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {ads.map((ad) => {
          // Use ad coordinates if available, otherwise use location coordinates
          const lat = ad.latitude || ad.location_latitude;
          const lng = ad.longitude || ad.location_longitude;

          if (!lat || !lng) return null;

          return (
            <Marker
              key={ad.id}
              position={[lat, lng]}
              icon={createAdMarker()}
              eventHandlers={{
                click: () => handleMarkerClick(ad)
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {ad.title}
                  </h4>

                  <div style={{
                    color: '#dc1e4a',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    {formatPrice(ad.price)}
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    marginBottom: '8px'
                  }}>
                    📍 {ad.location_name}
                    {ad.formatted_distance && (
                      <span style={{ marginLeft: '8px', color: '#059669' }}>
                        📏 {ad.formatted_distance}
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    marginBottom: '12px'
                  }}>
                    🏷️ {ad.category_name}
                  </div>

                  <button
                    onClick={() => handleMarkerClick(ad)}
                    style={{
                      backgroundColor: '#dc1e4a',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default InteractiveMap;