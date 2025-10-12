import { useState, useEffect, useRef } from 'react';
import { styles, colors, spacing, borderRadius, typography } from '../styles/theme';

function MapEditor({ initialLat, initialLng, initialAddress, onLocationChange }) {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(initialAddress || 'Click on map or search to set location');
  const [coordinates, setCoordinates] = useState({
    lat: initialLat || 27.7172, // Default to Kathmandu
    lng: initialLng || 85.3240
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  // Get API key from environment variable
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
      setError('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
      return;
    }

    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps. Please check your API key and internet connection.');
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [GOOGLE_MAPS_API_KEY]);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    try {
      // Initialize map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom: 16,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
      });

      // Initialize geocoder
      geocoderRef.current = new window.google.maps.Geocoder();

      // Create draggable marker
      markerRef.current = new window.google.maps.Marker({
        map: mapInstanceRef.current,
        position: { lat: coordinates.lat, lng: coordinates.lng },
        draggable: true,
        title: 'Drag me to your exact shop location',
        animation: window.google.maps.Animation.DROP
      });

      // Marker drag end event
      markerRef.current.addListener('dragend', function() {
        const position = markerRef.current.getPosition();
        updateLocationInfo(position.lat(), position.lng());
      });

      // Map click event
      mapInstanceRef.current.addListener('click', function(event) {
        placeMarker(event.latLng.lat(), event.latLng.lng());
      });

      // Initialize Places Autocomplete
      if (searchInputRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: 'np' }, // Restrict to Nepal
          fields: ['geometry', 'formatted_address', 'name']
        });

        autocompleteRef.current.addListener('place_changed', function() {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry) {
            placeMarker(
              place.geometry.location.lat(),
              place.geometry.location.lng()
            );
            setSearchAddress('');
          }
        });
      }

      // If initial coordinates exist, reverse geocode to get address
      if (initialLat && initialLng) {
        reverseGeocode(initialLat, initialLng);
      }
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error initializing map. Please try again.');
    }
  }, [mapLoaded]);

  const placeMarker = (lat, lng) => {
    const position = { lat, lng };
    markerRef.current.setPosition(position);
    mapInstanceRef.current.setCenter(position);
    markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
    setTimeout(() => markerRef.current.setAnimation(null), 750);
    updateLocationInfo(lat, lng);
  };

  const updateLocationInfo = (lat, lng) => {
    setCoordinates({ lat, lng });
    reverseGeocode(lat, lng);

    // Notify parent component
    if (onLocationChange) {
      onLocationChange({ lat, lng, address: null }); // Address will be updated after reverse geocoding
    }
  };

  const reverseGeocode = (lat, lng) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          setSelectedAddress(address);

          // Update parent with complete info
          if (onLocationChange) {
            onLocationChange({ lat, lng, address });
          }
        } else {
          setSelectedAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);

          if (onLocationChange) {
            onLocationChange({ lat, lng, address: null });
          }
        }
      }
    );
  };

  const handleSearch = () => {
    if (!searchAddress.trim() || !geocoderRef.current) return;

    geocoderRef.current.geocode(
      { address: searchAddress, componentRestrictions: { country: 'NP' } },
      (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          placeMarker(location.lat(), location.lng());
          setSearchAddress('');
        } else {
          alert('Address not found. Please try a different search term or click directly on the map.');
        }
      }
    );
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        placeMarker(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        alert('Unable to retrieve your location. Please search or click on the map.');
      }
    );
  };

  if (error) {
    return (
      <div style={{
        ...styles.card.default,
        padding: spacing.xl,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🗺️</div>
        <h3 style={{ color: colors.danger, marginBottom: spacing.sm }}>Map Error</h3>
        <p style={{ color: colors.text.secondary, marginBottom: spacing.lg }}>{error}</p>
        {GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE' && (
          <div style={{
            backgroundColor: colors.background.secondary,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            textAlign: 'left'
          }}>
            <strong>To enable maps:</strong>
            <ol style={{ marginTop: spacing.sm, paddingLeft: spacing.lg }}>
              <li>Get a Google Maps API key from Google Cloud Console</li>
              <li>Create <code>.env</code> file in frontend folder</li>
              <li>Add: <code>VITE_GOOGLE_MAPS_API_KEY=your_key_here</code></li>
              <li>Restart the development server</li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div style={{
        ...styles.card.default,
        padding: spacing.xl,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🗺️</div>
        <p style={{ color: colors.text.secondary }}>Loading map...</p>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.card.default,
      padding: spacing.lg
    }}>
      {/* Search Bar */}
      <div style={{
        marginBottom: spacing.md,
        display: 'flex',
        gap: spacing.sm
      }}>
        <input
          ref={searchInputRef}
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for your shop address..."
          style={{
            flex: 1,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
            fontSize: typography.fontSize.base,
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            ...styles.button.primary,
            padding: `${spacing.md} ${spacing.xl}`
          }}
        >
          🔍 Search
        </button>
        <button
          onClick={handleUseCurrentLocation}
          style={{
            ...styles.button.secondary,
            padding: `${spacing.md} ${spacing.lg}`
          }}
          title="Use my current location"
        >
          📍 Current Location
        </button>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: borderRadius.md,
          marginBottom: spacing.md,
          border: `2px solid ${colors.border}`
        }}
      />

      {/* Location Info Display */}
      <div style={{
        padding: spacing.md,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md
      }}>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          marginBottom: spacing.xs
        }}>
          Selected Location:
        </div>
        <div style={{
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          marginBottom: spacing.sm
        }}>
          {selectedAddress}
        </div>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        padding: spacing.md,
        backgroundColor: '#e3f2fd',
        borderRadius: borderRadius.md,
        borderLeft: `4px solid ${colors.primary}`
      }}>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.primary
        }}>
          <strong>💡 How to set your location:</strong>
          <ul style={{ marginTop: spacing.xs, marginBottom: 0, paddingLeft: spacing.lg }}>
            <li>Search for your address in the search box above</li>
            <li>Click directly on the map to place the marker</li>
            <li>Drag the marker to adjust the exact position</li>
            <li>Use "Current Location" to auto-detect your position</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MapEditor;
