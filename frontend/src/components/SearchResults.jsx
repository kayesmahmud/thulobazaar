import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdCard from './AdCard';
import SimpleHeader from './SimpleHeader';
import RecentlyViewed from './RecentlyViewed';
import AdvancedFilters from './AdvancedFilters';
import ApiService from '../services/api';

function SearchResults() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Mobile filter modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Initialize search filters from URL params immediately
  const getInitialFilters = () => {
    const urlParams = new URLSearchParams(location.search);
    return {
      search: urlParams.get('search') || '',
      category: urlParams.get('category') || 'all',
      location: urlParams.get('location') || 'all',
      minPrice: urlParams.get('minPrice') || '',
      maxPrice: urlParams.get('maxPrice') || '',
      condition: urlParams.get('condition') || 'all',
      datePosted: urlParams.get('datePosted') || 'any',
      dateFrom: urlParams.get('dateFrom') || '',
      dateTo: urlParams.get('dateTo') || '',
      sortBy: urlParams.get('sortBy') || 'date',
      sortOrder: urlParams.get('sortOrder') || 'desc'
    };
  };

  const [searchFilters, setSearchFilters] = useState(getInitialFilters);
  const [advancedFilters, setAdvancedFilters] = useState({
    priceRange: [
      parseInt(searchFilters.minPrice) || 0,
      parseInt(searchFilters.maxPrice) || 5000000
    ],
    condition: searchFilters.condition,
    datePosted: searchFilters.datePosted,
    customDateRange: {
      from: searchFilters.dateFrom,
      to: searchFilters.dateTo
    },
    sortBy: searchFilters.sortBy,
    sortOrder: searchFilters.sortOrder
  });

  // Update filters when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const newFilters = {
      search: urlParams.get('search') || '',
      category: urlParams.get('category') || 'all',
      location: urlParams.get('location') || 'all',
      minPrice: urlParams.get('minPrice') || '',
      maxPrice: urlParams.get('maxPrice') || '',
      condition: urlParams.get('condition') || 'all',
      datePosted: urlParams.get('datePosted') || 'any',
      dateFrom: urlParams.get('dateFrom') || '',
      dateTo: urlParams.get('dateTo') || '',
      sortBy: urlParams.get('sortBy') || 'date',
      sortOrder: urlParams.get('sortOrder') || 'desc'
    };
    setSearchFilters(newFilters);
    setAdvancedFilters({
      priceRange: [
        parseInt(newFilters.minPrice) || 0,
        parseInt(newFilters.maxPrice) || 5000000
      ],
      condition: newFilters.condition,
      datePosted: newFilters.datePosted,
      customDateRange: {
        from: newFilters.dateFrom,
        to: newFilters.dateTo
      },
      sortBy: newFilters.sortBy,
      sortOrder: newFilters.sortOrder
    });
  }, [location.search]);

  // Load categories and locations
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
        console.error('❌ Error fetching static data:', err);
      }
    };
    fetchStaticData();
  }, []);

  // Perform search when filters change
  useEffect(() => {
    const performSearch = async () => {
      try {
        setSearchLoading(true);
        console.log('🔍 Searching with filters:', searchFilters);

        const searchParams = {};
        if (searchFilters.search.trim()) searchParams.search = searchFilters.search.trim();
        if (searchFilters.category !== 'all') searchParams.category = searchFilters.category;
        if (searchFilters.location !== 'all') searchParams.location = searchFilters.location;
        if (searchFilters.minPrice) searchParams.minPrice = searchFilters.minPrice;
        if (searchFilters.maxPrice) searchParams.maxPrice = searchFilters.maxPrice;
        if (searchFilters.condition !== 'all') searchParams.condition = searchFilters.condition;
        if (searchFilters.datePosted !== 'any') {
          searchParams.datePosted = searchFilters.datePosted;
          if (searchFilters.datePosted === 'custom') {
            if (searchFilters.dateFrom) searchParams.dateFrom = searchFilters.dateFrom;
            if (searchFilters.dateTo) searchParams.dateTo = searchFilters.dateTo;
          }
        }
        if (searchFilters.sortBy !== 'date') searchParams.sortBy = searchFilters.sortBy;
        if (searchFilters.sortOrder !== 'desc') searchParams.sortOrder = searchFilters.sortOrder;

        console.log('📤 API request params:', searchParams);
        const response = await ApiService.getAds(searchParams);
        console.log('✅ Search results:', response);

        setAds(response.data);
      } catch (err) {
        console.error('❌ Error searching ads:', err);
        setError('Failed to search ads. Please try again.');
      } finally {
        setSearchLoading(false);
        setLoading(false);
      }
    };

    // Always perform search with current filters
    performSearch();
  }, [searchFilters]);

  const handleInputChange = (field, value) => {
    const newFilters = {
      ...searchFilters,
      [field]: value
    };
    setSearchFilters(newFilters);
    updateURL(newFilters);
  };

  const handleAdvancedFiltersChange = (filters) => {
    setAdvancedFilters(filters);

    // Convert advanced filters to search filters format
    const newFilters = {
      ...searchFilters,
      minPrice: filters.priceRange[0].toString(),
      maxPrice: filters.priceRange[1].toString(),
      condition: filters.condition,
      datePosted: filters.datePosted,
      dateFrom: filters.customDateRange.from,
      dateTo: filters.customDateRange.to,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };

    setSearchFilters(newFilters);
    updateURL(newFilters);
  };

  const updateURL = (filters) => {
    // Update URL
    const urlParams = new URLSearchParams();
    if (filters.search.trim()) urlParams.append('search', filters.search.trim());
    if (filters.category !== 'all') urlParams.append('category', filters.category);
    if (filters.location !== 'all') urlParams.append('location', filters.location);
    if (filters.minPrice) urlParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) urlParams.append('maxPrice', filters.maxPrice);
    if (filters.condition !== 'all') urlParams.append('condition', filters.condition);
    if (filters.datePosted !== 'any') {
      urlParams.append('datePosted', filters.datePosted);
      if (filters.datePosted === 'custom') {
        if (filters.dateFrom) urlParams.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) urlParams.append('dateTo', filters.dateTo);
      }
    }
    if (filters.sortBy !== 'date') urlParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder !== 'desc') urlParams.append('sortOrder', filters.sortOrder);

    const queryString = urlParams.toString();
    navigate(`/search${queryString ? `?${queryString}` : ''}`, { replace: true });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Trigger search by updating the search filter
      handleInputChange('search', e.target.value);
    }
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      category: 'all',
      location: 'all',
      minPrice: '',
      maxPrice: '',
      condition: 'all',
      datePosted: 'any',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setSearchFilters(clearedFilters);
    setAdvancedFilters({
      priceRange: [0, 5000000],
      condition: 'all',
      datePosted: 'any',
      customDateRange: { from: '', to: '' },
      sortBy: 'date',
      sortOrder: 'desc'
    });
    navigate('/search', { replace: true });
  };

  const hasActiveFilters = searchFilters.search || searchFilters.category !== 'all' ||
    searchFilters.location !== 'all' || searchFilters.minPrice ||
    searchFilters.maxPrice || searchFilters.condition !== 'all' ||
    searchFilters.datePosted !== 'any' || searchFilters.sortBy !== 'date' ||
    searchFilters.sortOrder !== 'desc';

  if (loading || authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔄 Loading search results...
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
        <h2>⚠️ Search Error</h2>
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

      {/* Search Bar Section */}
      <div className="search-section">
        <div className="search-content">
          {/* Search Bar Container - Same as Homepage */}
          <div className="search-bar-container">
            <form className="search-form" onSubmit={(e) => { e.preventDefault(); handleInputChange('search', searchFilters.search); }}>
              <input
                name="query"
                type="search"
                autoComplete="off"
                aria-label="Search input"
                className="search-input"
                placeholder="What are you looking for?"
                value={searchFilters.search}
                onChange={(e) => handleInputChange('search', e.target.value)}
              />
              <div className="search-button-container">
                <button
                  className="search-button"
                  type="submit"
                  aria-label="Search"
                >
                  <div className="search-icon">
                    <svg width="17" height="17" viewBox="0 0 17 17">
                      <path d="M7.615 15.23a7.615 7.615 0 1 1 6.1-3.054l2.966 2.967a1.088 1.088 0 0 1-1.539 1.538l-2.966-2.966a7.582 7.582 0 0 1-4.56 1.516zm5.44-7.615a5.44 5.44 0 1 1-10.88 0 5.44 5.44 0 0 1 10.88 0z" fillRule="evenodd"></path>
                    </svg>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Filter Buttons - Bikroy Style */}
      <section className="mobile-filter-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div className="mobile-filter-buttons">
            {/* Location Filter Button */}
            <button
              className="mobile-filter-btn location-btn"
              onClick={() => setShowLocationModal(true)}
            >
              <div className="filter-btn-icon">
                <svg viewBox="0 0 60 60" width="20" height="20">
  <path d="M30 10c-8.4 0-15.3 6.7-15.3 15 0 4.7 2.3 10.2 6.8 16.5 3.3 4.5 6.5 7.7 6.6 7.8.5.5 1.1.7 1.8.7s1.3-.2 1.8-.7c.1-.1 3.4-3.3 6.6-7.8 4.5-6.2 6.8-11.8 6.8-16.5.2-8.3-6.7-15-15.1-15zm0 8.8c3.5 0 6.4 2.8 6.4 6.2s-2.9 6.2-6.4 6.2c-3.5 0-6.4-2.8-6.4-6.2s2.9-6.2 6.4-6.2" fill="#dc1e4a"/>
</svg>
              </div>
              <span>Location</span>
            </button>

            {/* Category Filter Button */}
            <button
              className="mobile-filter-btn category-btn"
              onClick={() => setShowCategoryModal(true)}
            >
              <div className="filter-btn-icon">
                <svg viewBox="0 0 60 60" width="20" height="20">
  <path d="M47.834 26.901l-2.56-9.803c-.448-1.874-1.41-2.85-3.256-3.307l-9.655-2.599c-1.846-.456-3.134-.124-4.478 1.24L12.007 28.555c-1.343 1.364-1.343 3.596 0 4.96L25.85 47.57a3.427 3.427 0 0 0 4.885 0l15.878-16.122c1.344-1.364 1.67-2.672 1.22-4.547zm-12.62-2.894a3.546 3.546 0 0 1 0-4.96 3.418 3.418 0 0 1 4.885 0 3.545 3.545 0 0 1 0 4.96 3.417 3.417 0 0 1-4.886 0z" fill="#dc1e4a"/>
</svg>
              </div>
              <span>Category</span>
            </button>

            {/* Sort/Filter Button */}
            <button
              className="mobile-filter-btn sort-btn"
              onClick={() => setShowSortModal(true)}
            >
              <div className="filter-btn-icon">
                <svg width="24" height="25" viewBox="0 0 24 25">
  <g fill="none" fillRule="evenodd">
    <path fillOpacity="0" fill="none" d="M24 1v24H0V1z"/>
    <g transform="rotate(90 9 12)">
      <circle stroke="#dc1e4a" strokeWidth="2" cx="4" cy="2" r="2"/>
      <circle stroke="#dc1e4a" strokeWidth="2" cx="10" cy="16" r="2"/>
      <circle stroke="#dc1e4a" strokeWidth="2" cx="16" cy="9" r="2"/>
      <path d="M5 1h13.993C19.549 1 20 1.444 20 2c0 .552-.449 1-1.007 1H5V1zM0 2c0-.552.443-1 .999-1H3v2H.999A.997.997 0 0 1 0 2zM11 15h8.002c.551 0 .998.444.998 1 0 .552-.446 1-.998 1H11v-2zM17 8h2.001c.552 0 .999.444.999 1 0 .552-.443 1-.999 1H17V8zM0 16c0-.552.446-1 .998-1H9v2H.998A.996.996 0 0 1 0 16zM0 9c0-.552.449-1 1.007-1H15v2H1.007A1.001 1.001 0 0 1 0 9z" fill="#dc1e4a"/>
    </g>
  </g>
</svg>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ backgroundColor: '#ffffff' }}>
        <div className="main-content-grid" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '30px',
          minHeight: '70vh'
        }}>
          {/* Left Sidebar - Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Basic Filters */}
            <div className="sidebar" style={{
              backgroundColor: '#f8fafc',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                color: '#1e293b',
                fontSize: '18px',
                fontWeight: 'bold',
                borderBottom: '2px solid #dc1e4a',
                paddingBottom: '10px'
              }}>
                🔍 Basic Filters
              </h3>

              {/* Category Filter */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  📂 Category
                </h4>
                <select
                  value={searchFilters.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  📍 Location
                </h4>
                <select
                  value={searchFilters.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="all">All of Nepal</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
              onFiltersChange={handleAdvancedFiltersChange}
              initialFilters={advancedFilters}
            />

            {/* Clear All Filters */}
            <button
              onClick={clearAllFilters}
              style={{
                width: '100%',
                padding: '12px',
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

            {/* Recently Viewed */}
            <RecentlyViewed maxItems={3} />
          </div>

          {/* Right Content - Search Results */}
          <div className="content-area">
            {/* Results Header */}
            <div className="results-header" style={{ marginBottom: '24px' }}>
              <h2 style={{
                margin: '0 0 8px 0',
                color: '#1e293b',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                Search Results ({ads.length} ads found)
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
                  border: '1px solid #bae6fd'
                }}>
                  Showing filtered results
                </div>
              )}
            </div>

            {/* Results Grid */}
            <div className="ads-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {ads.length > 0 ? (
                ads.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))
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
      </section>

      {/* Mobile Filter Modals */}
      {/* Location Modal */}
      {showLocationModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Select Location</h3>
              <button onClick={() => setShowLocationModal(false)}>×</button>
            </div>
            <div className="mobile-modal-content">
              {['all', ...locations.map(loc => loc.name)].map((location) => (
                <button
                  key={location}
                  className={`mobile-modal-option ${searchFilters.location === location ? 'selected' : ''}`}
                  onClick={() => {
                    handleInputChange('location', location);
                    setShowLocationModal(false);
                  }}
                >
                  {location === 'all' ? 'All of Nepal' : location}
                  {searchFilters.location === location && <span className="checkmark">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Select Category</h3>
              <button onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            <div className="mobile-modal-content">
              {['all', ...categories.map(cat => cat.name)].map((category) => (
                <button
                  key={category}
                  className={`mobile-modal-option ${searchFilters.category === category ? 'selected' : ''}`}
                  onClick={() => {
                    handleInputChange('category', category);
                    setShowCategoryModal(false);
                  }}
                >
                  {category === 'all' ? 'All Categories' : category}
                  {searchFilters.category === category && <span className="checkmark">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sort Modal */}
      {showSortModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowSortModal(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>Sort & Filter</h3>
              <button onClick={() => setShowSortModal(false)}>×</button>
            </div>
            <div className="mobile-modal-content">
              <div className="mobile-modal-section">
                <h4>Sort By</h4>
                {[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                  { value: 'popular', label: 'Most Popular' }
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`mobile-modal-option ${searchFilters.sortBy === option.value ? 'selected' : ''}`}
                    onClick={() => {
                      handleInputChange('sortBy', option.value);
                      setShowSortModal(false);
                    }}
                  >
                    {option.label}
                    {searchFilters.sortBy === option.value && <span className="checkmark">✓</span>}
                  </button>
                ))}
              </div>

              <div className="mobile-modal-section">
                <h4>Price Range (NPR)</h4>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={searchFilters.minPrice}
                    onChange={(e) => handleInputChange('minPrice', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={searchFilters.maxPrice}
                    onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                  />
                </div>
                <button
                  className="apply-price-btn"
                  onClick={() => setShowSortModal(false)}
                >
                  Apply Price Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResults;