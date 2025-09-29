import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import SimpleHeader from './SimpleHeader';
import InteractiveMap from './InteractiveMap';
import { getUserLocation, nepaliCities } from '../utils/locationUtils';
import { formatDateTime } from '../utils/dateUtils';

function NearbyAds() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radius, setRadius] = useState(25);
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await ApiService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleGetUserLocation = async () => {
    try {
      setLoading(true);
      setError('');

      const location = await getUserLocation();
      setUserLocation(location);
      setSelectedLocation({
        name: 'Your Location',
        lat: location.latitude,
        lng: location.longitude
      });

      // Automatically search for nearby ads
      await searchNearbyAds(location.latitude, location.longitude);
    } catch (err) {
      setError(err.message || 'Failed to get your location');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = async (city) => {
    setSelectedLocation(city);
    setUserLocation({ latitude: city.lat, longitude: city.lng });
    await searchNearbyAds(city.lat, city.lng);
  };

  const searchNearbyAds = async (lat, lng) => {
    try {
      setLoading(true);
      setError('');

      const searchParams = {
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
        limit: '50'
      };

      // Only add category if it's not 'all'
      if (category !== 'all') {
        searchParams.category = category;
      }

      const response = await fetch(`http://localhost:5000/api/ads/nearby?${new URLSearchParams(searchParams)}`);
      const data = await response.json();

      if (data.success) {
        setAds(data.data);
      } else {
        setError(data.message || 'Failed to fetch nearby ads');
      }
    } catch (err) {
      console.error('Error fetching nearby ads:', err);
      setError('Failed to fetch nearby ads');
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = (ad) => {
    const titleSlug = ad.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    const locationSlug = ad.location_name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    navigate(`/ad/${titleSlug}-${locationSlug}-${ad.id}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };


  return (
    <div>
      <SimpleHeader />

      <div className="nearby-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Find Ads Near You
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Discover items and services in your area
          </p>
        </div>

        {/* Location Selection */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '32px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Choose Your Location</h3>

          {/* Get Current Location Button */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleGetUserLocation}
              disabled={loading}
              style={{
                backgroundColor: '#dc1e4a',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              📍 Use My Current Location
            </button>
          </div>

          {/* City Selection */}
          <div>
            <p style={{ margin: '0 0 12px 0', fontWeight: '500', color: '#374151' }}>
              Or choose a city:
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '8px'
            }}>
              {nepaliCities.map((city, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectCity(city)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: selectedLocation?.name === city.name ? '#dc1e4a' : 'white',
                    color: selectedLocation?.name === city.name ? 'white' : '#374151',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          {selectedLocation && (
            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Search Radius:
                </label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Category:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug || cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => searchNearbyAds(selectedLocation.lat, selectedLocation.lng)}
                disabled={loading}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '20px'
                }}
              >
                🔍 Search
              </button>
            </div>
          )}
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #bfdbfe'
          }}>
            <p style={{ margin: 0, color: '#1e40af' }}>
              📍 Searching near <strong>{selectedLocation.name}</strong> within {radius}km radius
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
            <p>Finding nearby ads...</p>
          </div>
        )}

        {/* Results */}
        {!loading && ads.length > 0 && (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                Found {ads.length} ads nearby
              </h3>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: viewMode === 'list' ? '#dc1e4a' : 'white',
                    color: viewMode === 'list' ? 'white' : '#374151',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  📋 List View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: viewMode === 'map' ? '#dc1e4a' : 'white',
                    color: viewMode === 'map' ? 'white' : '#374151',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  🗺️ Map View
                </button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <InteractiveMap
                ads={ads}
                center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [27.7172, 85.3240]}
                zoom={selectedLocation ? Math.max(10, 15 - Math.log10(radius)) : 10}
                height="500px"
                onAdClick={handleAdClick}
              />
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                {ads.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => handleAdClick(ad)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      {ad.category_icon || '📦'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1e293b',
                        lineHeight: '1.3'
                      }}>
                        {ad.title}
                      </h4>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      color: '#dc1e4a',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {formatPrice(ad.price)}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span>📍 {ad.location_name}</span>
                    <span>🕒 {formatDateTime(ad.created_at)}</span>
                  </div>

                  {ad.formatted_distance && (
                    <div style={{
                      fontSize: '12px',
                      color: '#059669',
                      fontWeight: '500',
                      backgroundColor: '#ecfdf5',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      📏 {ad.formatted_distance} away
                    </div>
                  )}
                </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* No Results */}
        {!loading && selectedLocation && ads.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No ads found nearby</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Try increasing the search radius or selecting a different location.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NearbyAds;