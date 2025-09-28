import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdCard from './AdCard';
import SimpleHeader from './SimpleHeader';
import RecentlyViewed from './RecentlyViewed';
import Breadcrumb from './Breadcrumb';
import ApiService from '../services/api';

function AllAds() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const adsPerPage = 12;

  // Sort and filter state
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Load static data (categories and locations)
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [categoriesData, locationsData] = await Promise.all([
          ApiService.getCategories(),
          ApiService.getLocations()
        ]);

        setCategories(categoriesData);
        setLocations(locationsData);
      } catch (err) {
        console.error('Error fetching static data:', err);
      }
    };

    fetchStaticData();
  }, []);

  // Load ads based on filters and pagination
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const searchParams = {
          sortBy,
          limit: adsPerPage,
          offset: (currentPage - 1) * adsPerPage
        };

        if (selectedCategory !== 'all') {
          searchParams.category = selectedCategory;
        }
        if (selectedLocation !== 'all') {
          searchParams.location = selectedLocation;
        }

        const response = await ApiService.getAds(searchParams);
        setAds(response.data);
        setTotalAds(response.pagination.total);

      } catch (err) {
        console.error('Error fetching ads:', err);
        setError('Failed to load ads. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [currentPage, sortBy, selectedCategory, selectedLocation]);


  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setCurrentPage(1); // Reset to first page
  };

  const totalPages = Math.ceil(totalAds / adsPerPage);

  if (loading || authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔄 Loading ads...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        color: '#dc1e4a'
      }}>
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <SimpleHeader showUserWelcome={true} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: 'All Ads', current: true }
        ]}
      />

      {/* Page Header */}
      <div className="page-header" style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '40px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            All Classified Ads in Nepal
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: 0
          }}>
            Browse {totalAds.toLocaleString()} ads posted by people across Nepal
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div className="main-content-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>

          {/* Left Sidebar - Filters */}
          <div className="sidebar">
            {/* Sort Options */}
            <div className="filter-section" style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                Sort by
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' }
                ].map((option) => (
                  <label key={option.value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) => handleSortChange(e.target.value)}
                      style={{ marginRight: '8px' }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-section" style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                Category
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  <input
                    type="radio"
                    name="category"
                    value="all"
                    checked={selectedCategory === 'all'}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  All Categories
                </label>
                {categories.map((category) => (
                  <label key={category.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    <input
                      type="radio"
                      name="category"
                      value={category.name}
                      checked={selectedCategory === category.name}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      style={{ marginRight: '8px' }}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div className="filter-section" style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                Location
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  <input
                    type="radio"
                    name="location"
                    value="all"
                    checked={selectedLocation === 'all'}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  All of Nepal
                </label>
                {locations.map((location) => (
                  <label key={location.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    <input
                      type="radio"
                      name="location"
                      value={location.name}
                      checked={selectedLocation === location.name}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      style={{ marginRight: '8px' }}
                    />
                    {location.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Recently Viewed */}
            <RecentlyViewed maxItems={4} />
          </div>

          {/* Right Content - Ads Grid */}
          <div className="content-area">
            {/* Results Header */}
            <div className="results-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  margin: '0 0 4px 0'
                }}>
                  All Ads
                </h2>
                <p style={{
                  color: '#64748b',
                  fontSize: '14px',
                  margin: 0
                }}>
                  Showing {((currentPage - 1) * adsPerPage) + 1}-{Math.min(currentPage * adsPerPage, totalAds)} of {totalAds} ads
                </p>
              </div>
            </div>

            {/* Ads Grid */}
            {ads.length > 0 ? (
              <>
                <div className="ads-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '24px',
                  marginBottom: '40px'
                }}>
                  {ads.map((ad) => (
                    <AdCard key={ad.id} ad={ad} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination-container" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '40px'
                  }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: currentPage === 1 ? '#f8fafc' : 'white',
                        color: currentPage === 1 ? '#94a3b8' : '#374151',
                        borderRadius: '6px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ← Previous
                    </button>

                    <div style={{
                      display: 'flex',
                      gap: '4px'
                    }}>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: currentPage === pageNum ? '#dc1e4a' : 'white',
                              color: currentPage === pageNum ? 'white' : '#374151',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: currentPage === totalPages ? '#f8fafc' : 'white',
                        color: currentPage === totalPages ? '#94a3b8' : '#374151',
                        borderRadius: '6px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No ads found</h3>
                <p style={{ margin: 0 }}>
                  Try adjusting your filters to see more results.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllAds;