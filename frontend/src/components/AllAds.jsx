import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AdCard from './AdCard';
import SimpleHeader from './SimpleHeader';
import RecentlyViewed from './RecentlyViewed';
import Breadcrumb from './Breadcrumb';
import SearchFiltersPanel from './search/SearchFiltersPanel';
import ApiService from '../services/api';

function AllAds() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const adsPerPage = 20;

  // Advanced filter state - cleaned up to match SearchResults
  const [filters, setFilters] = useState({
    category: 'all',
    subcategory: '',
    location: 'all',
    minPrice: '',
    maxPrice: '',
    condition: 'all',
    sortBy: 'newest'
  });

  // Load static data (categories and locations)
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        // Fetch categories with subcategories
        const categoriesData = await ApiService.getCategories(true);
        setCategories(categoriesData);

        // Fetch complete location hierarchy in a single API call
        const locationHierarchy = await ApiService.getLocationHierarchy();
        setLocations(locationHierarchy);
      } catch (err) {
        console.error('❌ Error fetching static data:', err);
      }
    };

    fetchStaticData();
  }, []);

  // Create O(1) lookup maps for locations and categories
  const { locationMap, categoryMap } = useMemo(() => {
    const locMap = new Map();
    const catMap = new Map();

    // Build location map: name -> id
    locations.forEach(province => {
      locMap.set(province.name, province.id);

      if (province.districts) {
        province.districts.forEach(district => {
          locMap.set(district.name, district.id);

          if (district.municipalities) {
            district.municipalities.forEach(municipality => {
              locMap.set(municipality.name, municipality.id);
            });
          }
        });
      }
    });

    // Build category map: name -> id
    categories.forEach(category => {
      catMap.set(category.name, category.id);

      if (category.subcategories) {
        category.subcategories.forEach(subcat => {
          catMap.set(subcat.name, subcat.id);
        });
      }
    });

    return { locationMap: locMap, categoryMap: catMap };
  }, [locations, categories]);

  // O(1) category lookup
  const selectedCategoryId = useMemo(() => {
    if (filters.subcategory) {
      const id = categoryMap.get(filters.subcategory);
      return id ? id.toString() : '';
    }
    if (filters.category === 'all' || !filters.category) return '';
    const id = categoryMap.get(filters.category);
    return id ? id.toString() : '';
  }, [filters.category, filters.subcategory, categoryMap]);

  // O(1) location lookup
  const selectedLocationId = useMemo(() => {
    if (filters.location === 'all') return '';
    const id = locationMap.get(filters.location);
    return id ? id.toString() : '';
  }, [filters.location, locationMap]);

  // Load ads based on filters and pagination
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setSearchLoading(true);

        // Build search params with all advanced filters
        const searchParams = {};

        // Category filtering: use parentCategoryId for parent categories to include all subcategories
        if (filters.subcategory) {
          // Subcategory selected - filter by specific subcategory only
          searchParams.category = filters.subcategory;
        } else if (filters.category !== 'all') {
          // Parent category selected - use parentCategoryId to include all subcategories
          const parentCategory = categories.find(c => c.name === filters.category);
          if (parentCategory) {
            searchParams.parentCategoryId = parentCategory.id;
            console.log(`🏷️ [AllAds] Using parentCategoryId: ${parentCategory.id} for category: ${filters.category}`);
          }
        }

        // Location filtering - use location_name for hierarchical filtering with recursive CTE
        if (filters.location !== 'all') {
          // Use location_name for hierarchical filtering (includes all child locations)
          searchParams.location_name = filters.location;
          console.log('🗺️ [AllAds] Using location_name for hierarchical filtering:', filters.location);
        }

        // Price filters
        if (filters.minPrice) searchParams.minPrice = filters.minPrice;
        if (filters.maxPrice) searchParams.maxPrice = filters.maxPrice;

        // Condition filter
        if (filters.condition !== 'all') searchParams.condition = filters.condition;

        // Sort
        if (filters.sortBy && filters.sortBy !== 'newest') searchParams.sortBy = filters.sortBy;

        // Pagination
        searchParams.limit = adsPerPage;
        searchParams.offset = (currentPage - 1) * adsPerPage;

        console.log('🔍 [AllAds] Fetching ads with params:', searchParams);
        const response = await ApiService.getAds(searchParams);
        setAds(response.data);
        setTotalAds(response.pagination.total);

      } catch (err) {
        console.error('❌ Error fetching ads:', err);
        setError('Failed to load ads. Please try again.');
      } finally {
        setSearchLoading(false);
        setLoading(false);
      }
    };

    fetchAds();
  }, [currentPage, filters]);


  // Handler for location selection from LocationHierarchyBrowser
  const handleLocationSelect = (selection) => {
    console.log('✨ [AllAds] Location selected:', selection);

    if (!selection) {
      // Clear location filter
      setFilters(prev => ({
        ...prev,
        location: 'all'
      }));
      setCurrentPage(1);
      return;
    }

    // Use location name for hierarchical filtering
    setFilters(prev => ({
      ...prev,
      location: selection.name
    }));
    console.log('🗺️ [AllAds] Set location to:', selection.name);
    setCurrentPage(1);
  };

  // Handler for category change
  const handleCategoryChange = (categoryId) => {
    if (!categoryId) {
      // Clear both category and subcategory
      setFilters({ ...filters, category: 'all', subcategory: '' });
      setCurrentPage(1);
      return;
    }

    const id = parseInt(categoryId);
    let parentCategoryName = '';
    let subcategoryName = '';

    // Check if it's a main category
    const mainCategory = categories.find(c => c.id === id);
    if (mainCategory) {
      parentCategoryName = mainCategory.name;
      subcategoryName = '';
    } else {
      // Search in subcategories
      for (const cat of categories) {
        if (cat.subcategories && cat.subcategories.length > 0) {
          const subcat = cat.subcategories.find(s => s.id === id);
          if (subcat) {
            parentCategoryName = cat.name;
            subcategoryName = subcat.name;
            break;
          }
        }
      }
    }

    setFilters({
      ...filters,
      category: parentCategoryName || 'all',
      subcategory: subcategoryName
    });
    setCurrentPage(1);
  };

  // Handler for price range change
  const handlePriceRangeChange = (range) => {
    setFilters({
      ...filters,
      minPrice: range.min || '',
      maxPrice: range.max || ''
    });
    setCurrentPage(1);
  };

  // Handler for condition change
  const handleConditionChange = (value) => {
    setFilters({ ...filters, condition: value || 'all' });
    setCurrentPage(1);
  };

  // Handler for clear all filters
  const clearAllFilters = () => {
    setFilters({
      category: 'all',
      subcategory: '',
      location: 'all',
      minPrice: '',
      maxPrice: '',
      condition: 'all',
      sortBy: 'newest'
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.category !== 'all' || filters.subcategory ||
    filters.location !== 'all' ||
    filters.minPrice || filters.maxPrice ||
    filters.condition !== 'all' || filters.sortBy !== 'newest';

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

          {/* Left Sidebar - Modern Filters */}
          <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Search Filters Panel */}
            <SearchFiltersPanel
              categories={categories}
              locations={locations}
              selectedCategory={selectedCategoryId}
              selectedLocation={selectedLocationId}
              priceRange={{
                min: filters.minPrice || '',
                max: filters.maxPrice || ''
              }}
              condition={filters.condition === 'all' ? '' : filters.condition}
              enableAreaFiltering={true}
              onLocationSelect={handleLocationSelect}
              onCategoryChange={handleCategoryChange}
              onPriceRangeChange={handlePriceRangeChange}
              onConditionChange={handleConditionChange}
              onClearFilters={clearAllFilters}
            />

            {/* Recently Viewed */}
            <RecentlyViewed maxItems={3} />
          </div>

          {/* Right Content - Ads Grid */}
          <div className="content-area">
            {/* Results Header */}
            <div className="results-header" style={{ marginBottom: '24px' }}>
              <h2 style={{
                margin: '0 0 8px 0',
                color: '#1e293b',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                All Ads ({totalAds} ads found)
                {searchLoading && <span style={{ color: '#64748b', fontSize: '16px' }}> ⏳</span>}
              </h2>
              <div style={{
                height: '2px',
                backgroundColor: '#dc1e4a',
                width: '60px',
                marginBottom: '16px'
              }}></div>
              {hasActiveFilters && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  marginBottom: '16px'
                }}>
                  Showing filtered results
                  <button
                    onClick={clearAllFilters}
                    style={{
                      marginLeft: '12px',
                      padding: '4px 8px',
                      backgroundColor: '#dc1e4a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
              <div style={{
                padding: '16px 0',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Showing {totalAds > 0 ? ((currentPage - 1) * adsPerPage) + 1 : 0}-{Math.min(currentPage * adsPerPage, totalAds)} of {totalAds} results
              </div>
            </div>

            {/* Ads Grid */}
            {ads.length > 0 ? (
              <>
                <div className="ads-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '40px'
                }}>
                  {ads.map((ad) => (
                    <AdCard key={ad.id} ad={ad} language={language} />
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
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '20px' }}>No ads found</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>
                  {hasActiveFilters
                    ? 'Try adjusting your search filters or clear them to see all ads.'
                    : 'No ads available at the moment.'
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#dc1e4a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    🗑️ Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-top">
            {/* Help & Support */}
            <div className="footer-section">
              <h3>Help & Support</h3>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Stay Safe</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Customer Service</a></li>
                <li><a href="#">Report an Issue</a></li>
              </ul>
            </div>

            {/* About Thulobazaar */}
            <div className="footer-section">
              <h3>About Thulobazaar</h3>
              <ul className="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Terms & Conditions</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Sitemap</a></li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul className="footer-links">
                <li><a href="#">All Categories</a></li>
                <li><a href="#">Featured Ads</a></li>
                <li><a href="#">Post Free Ad</a></li>
                <li><a href="#">Promote Your Ad</a></li>
                <li><a href="#">Membership</a></li>
              </ul>
            </div>

            {/* Connect & Download */}
            <div className="footer-section">
              <div className="social-section">
                <h3>Follow Us</h3>
                <p className="social-text">Stay connected for latest updates</p>
                <div className="social-icons">
                  <a href="#" className="social-icon">📘</a>
                  <a href="#" className="social-icon">📷</a>
                  <a href="#" className="social-icon">🐦</a>
                  <a href="#" className="social-icon">🔗</a>
                  <a href="#" className="social-icon">📺</a>
                </div>
              </div>

              <div className="app-download">
                <p className="app-title">Download Our App</p>
                <div className="app-buttons">
                  <a href="#" className="app-button">
                    <span className="app-icon">📱</span>
                    <div>
                      <div style={{fontSize: '12px', color: '#94a3b8'}}>Get it on</div>
                      <div style={{fontWeight: '600'}}>Google Play</div>
                    </div>
                  </a>
                  <a href="#" className="app-button">
                    <span className="app-icon">🍎</span>
                    <div>
                      <div style={{fontSize: '12px', color: '#94a3b8'}}>Download on the</div>
                      <div style={{fontWeight: '600'}}>App Store</div>
                    </div>
                  </a>
                </div>
              </div>

            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-copyright">
              © 2024 Thulobazaar. All rights reserved. Made with ❤️ in Nepal
            </div>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
              <a href="#">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AllAds;