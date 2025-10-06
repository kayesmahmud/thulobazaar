import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AdCard from './AdCard';
import SimpleHeader from './SimpleHeader';
import RecentlyViewed from './RecentlyViewed';
import AdvancedFilters from './AdvancedFilters';
import ApiService from '../services/api';
import { getCategoryFromSlug, getCategorySlug, reverseCategoryMappings } from '../utils/seoUtils';

function SearchResults() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { category: categoryParam } = useParams();
  console.log('SearchResults Render - categoryParam:', categoryParam);

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

  // Get category from URL path (/en/fashion) or query params (?category=Fashion)
  const urlParams = new URLSearchParams(location.search);
  let categoryFromURL = 'all';

  if (categoryParam && categoryParam !== 'search' && categoryParam !== 'en' && categoryParam !== 'ne') {
    // Path-based category: /en/fashion → Fashion
    categoryFromURL = getCategoryFromSlug(categoryParam);
  } else if (urlParams.get('category')) {
    // Query param category: ?category=Fashion
    categoryFromURL = urlParams.get('category');
  }
  console.log('SearchResults Render - categoryFromURL (after getCategoryFromSlug):', categoryFromURL);

  const searchFilters = {
      search: urlParams.get('search') || '',
      category: categoryFromURL,
      location: urlParams.get('location') || 'all',
      minPrice: urlParams.get('minPrice') || '',
      maxPrice: urlParams.get('maxPrice') || '',
      condition: urlParams.get('condition') || 'all',
      datePosted: urlParams.get('datePosted') || 'any',
      dateFrom: urlParams.get('dateFrom') || '',
      dateTo: urlParams.get('dateTo') || '',
      sortBy: urlParams.get('sortBy') || 'newest',
      sortOrder: urlParams.get('sortOrder') || 'desc'
  };

  console.log('SearchResults Render - searchFilters (initial):', searchFilters);

  const advancedFilters = {
    priceRange: [
      searchFilters.minPrice ? parseInt(searchFilters.minPrice) : 0,
      searchFilters.maxPrice ? parseInt(searchFilters.maxPrice) : 0
    ],
    condition: searchFilters.condition,
    datePosted: searchFilters.datePosted,
    customDateRange: {
      from: searchFilters.dateFrom,
      to: searchFilters.dateTo
    },
    sortBy: searchFilters.sortBy,
    sortOrder: searchFilters.sortOrder
  };

  // Track if we're currently updating to prevent loops


  console.log('Component Render - searchFilters:', searchFilters);

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

  // Combined useEffect: Update filters from URL and perform search
  useEffect(() => {

    const performSearchWithNewFilters = async () => {
      try {
        setSearchLoading(true);

        console.log('🔍 Searching with filters:', searchFilters);

        // Build search params
        const searchParams = {};
        if (searchFilters.search.trim()) searchParams.search = searchFilters.search.trim();
        if (searchFilters.category !== 'all') searchParams.category = searchFilters.category;
        if (searchFilters.location !== 'all') {
          // Convert location name back to ID for API call
          const selectedLocation = locations.find(loc => loc.name === searchFilters.location);
          if (selectedLocation) {
            searchParams.location = selectedLocation.id;
          } else {
            // If location name not found, treat as 'all' or handle error
            searchParams.location = 'all';
          }
        }
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
        if (searchFilters.sortBy && searchFilters.sortBy !== 'newest') searchParams.sortBy = searchFilters.sortBy;
        if (searchFilters.sortOrder && searchFilters.sortOrder !== 'desc') searchParams.sortOrder = searchFilters.sortOrder;

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

    performSearchWithNewFilters();
  }, [location.pathname, location.search]); // Watch both path and query params

  const handleInputChange = (field, value) => {
    console.log('handleInputChange - field:', field, 'value:', value);
    // Only update if value actually changed
    if (searchFilters[field] == value) {
      return;
    }

    const newFilters = {
      ...searchFilters,
      [field]: value
    };
    updateURL(newFilters);
  };

  const handleAdvancedFiltersChange = (filters) => {
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

    updateURL(newFilters);
  };

  const updateURL = (filters) => {
    // Build the new URL from filters
    const urlParams = new URLSearchParams();

    if (filters.search.trim()) urlParams.append('search', filters.search.trim());
    if (filters.category && filters.category !== 'all') urlParams.append('category', filters.category);
    if (filters.location !== 'all') urlParams.append('location', filters.location);
    if (filters.minPrice && filters.minPrice !== '0' && filters.minPrice !== '') urlParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice && filters.maxPrice !== '0' && filters.maxPrice !== '') urlParams.append('maxPrice', filters.maxPrice);
    if (filters.condition !== 'all') urlParams.append('condition', filters.condition);
    if (filters.datePosted !== 'any') {
      urlParams.append('datePosted', filters.datePosted);
      if (filters.datePosted === 'custom') {
        if (filters.dateFrom) urlParams.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) urlParams.append('dateTo', filters.dateTo);
      }
    }
    if (filters.sortBy && filters.sortBy !== 'newest') urlParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder && filters.sortOrder !== 'desc') urlParams.append('sortOrder', filters.sortOrder);

    const newQueryString = urlParams.toString();

    // Determine the base path
    const basePath = `/${language}/search`;

    const newUrl = `${basePath}${newQueryString ? `?${newQueryString}` : ''}`;
    const currentUrl = location.pathname + location.search;

    // Only navigate if URL is actually different
    if (newUrl !== currentUrl) {
      console.log('🔄 Navigating from', currentUrl, 'to', newUrl);
      navigate(newUrl, { replace: true });
    } else {
      console.log('⏭️ URL unchanged, skipping navigation');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // Trigger search by updating the search filter
      handleInputChange('search', e.target.value);
    }
  };

  const clearAllFilters = () => {
    navigate(`/${language}/search`, { replace: true });
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


  // Generate SEO meta data based on filters
  const generatePageTitle = () => {
    const parts = [];
    if (searchFilters.search) parts.push(searchFilters.search);
    if (searchFilters.category && searchFilters.category !== 'all') parts.push(searchFilters.category);
    if (searchFilters.location && searchFilters.location !== 'all') parts.push(`in ${searchFilters.location}`);
    return parts.length > 0 ? `${parts.join(' ')} - Thulobazaar` : 'Search Results - Thulobazaar';
  };

  const generateMetaDescription = () => {
    const category = searchFilters.category !== 'all' ? searchFilters.category : 'items';
    const location = searchFilters.location !== 'all' ? ` in ${searchFilters.location}` : ' across Nepal';
    return `Find ${category}${location}. Browse ${ads.length} ads on Thulobazaar, Nepal's leading classifieds marketplace.`;
  };

  return (
    <div>
      <Helmet>
        <title>{generatePageTitle()}</title>
        <meta name="description" content={generateMetaDescription()} />
        <meta name="keywords" content={`${searchFilters.category}, ${searchFilters.location}, Nepal classifieds, ${searchFilters.search}`} />
        <link rel="canonical" href={`${window.location.origin}${location.pathname}${location.search}`} />

        {/* Open Graph tags */}
        <meta property="og:title" content={generatePageTitle()} />
        <meta property="og:description" content={generateMetaDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}${location.pathname}${location.search}`} />
      </Helmet>

      {/* Header */}
      <SimpleHeader showUserWelcome={true} />


      {/* Search Bar Section */}
      <div className="search-section">
        <div className="search-content">
          {/* Search Bar Container - Same as Homepage */}
          <div className="search-bar-container">
            <form className="search-form" onSubmit={(e) => { e.preventDefault(); handleInputChange('search', e.currentTarget.elements.query.value); }}>
              <input
                name="query"
                type="search"
                autoComplete="off"
                aria-label="Search input"
                className="search-input"
                placeholder="What are you looking for?"
                defaultValue={searchFilters.search}
                onKeyPress={handleKeyPress}
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
          {/* Left Sidebar - Filters (Hidden on mobile) */}
          <div className="desktop-only-filters" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  <AdCard key={ad.id} ad={ad} language={language} />
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
              <button
                className={`mobile-modal-option ${searchFilters.location === 'all' ? 'selected' : ''}`}
                onClick={() => {
                  handleInputChange('location', 'all');
                  setShowLocationModal(false);
                }}
              >
                All of Nepal
                {searchFilters.location === 'all' && <span className="checkmark">✓</span>}
              </button>
              {locations.map((location) => (
                <button
                  key={location.id}
                  className={`mobile-modal-option ${searchFilters.location == location.name ? 'selected' : ''}`}
                  onClick={() => {
                    handleInputChange('location', location.name);
                    setShowLocationModal(false);
                  }}
                >
                  {location.name}
                  {searchFilters.location == location.name && <span className="checkmark">✓</span>}
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
              <button
                className={`mobile-modal-option ${searchFilters.category === 'all' ? 'selected' : ''}`}
                onClick={() => {
                  handleInputChange('category', 'all');
                  setShowCategoryModal(false);
                }}
              >
                All Categories
                {searchFilters.category === 'all' && <span className="checkmark">✓</span>}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`mobile-modal-option ${searchFilters.category == cat.name ? 'selected' : ''}`}
                  onClick={() => {
                    handleInputChange('category', cat.name);
                    setShowCategoryModal(false);
                  }}
                >
                  {cat.name}
                  {searchFilters.category == cat.name && <span className="checkmark">✓</span>}
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
              {/* Condition Filter */}
              <div className="mobile-modal-section">
                <h4>Condition</h4>
                {[
                  { value: 'all', label: 'All Conditions' },
                  { value: 'new', label: 'New' },
                  { value: 'used', label: 'Used' }
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`mobile-modal-option ${searchFilters.condition === option.value ? 'selected' : ''}`}
                    onClick={() => {
                      handleInputChange('condition', option.value);
                    }}
                  >
                    {option.label}
                    {searchFilters.condition === option.value && <span className="checkmark">✓</span>}
                  </button>
                ))}
              </div>

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
              </div>

              {/* Apply Button */}
              <button
                className="apply-filters-btn"
                onClick={() => setShowSortModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#dc1e4a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginTop: '10px',
                  cursor: 'pointer'
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

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

export default SearchResults;