import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AdCard from './AdCard';
import Header from './Header';
import RecentlyViewed from './RecentlyViewed';
import AdvancedFilters from './AdvancedFilters';
import SearchFiltersPanel from './search/SearchFiltersPanel';
import Pagination from './Pagination';
import ApiService from '../services/api';
import { getCategoryFromSlug, getCategorySlug, reverseCategoryMappings } from '../utils/seoUtils';

function SearchResults() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { category: categoryParam } = useParams();

  const [ads, setAds] = useState([]);
  const [totalAds, setTotalAds] = useState(0);
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

  const searchFilters = {
      search: urlParams.get('search') || '',
      category: urlParams.get('category') || categoryFromURL,
      subcategory: urlParams.get('subcategory') || '',
      location: urlParams.get('location') || 'all',
      area_ids: urlParams.get('area_ids') || '',
      province_id: urlParams.get('province_id') || '',
      district_id: urlParams.get('district_id') || '',
      municipality_id: urlParams.get('municipality_id') || '',
      ward: urlParams.get('ward') || '',
      minPrice: urlParams.get('minPrice') || '',
      maxPrice: urlParams.get('maxPrice') || '',
      condition: urlParams.get('condition') || 'all',
      datePosted: urlParams.get('datePosted') || 'any',
      dateFrom: urlParams.get('dateFrom') || '',
      dateTo: urlParams.get('dateTo') || '',
      sortBy: urlParams.get('sortBy') || 'newest',
      sortOrder: urlParams.get('sortOrder') || 'desc',
      page: parseInt(urlParams.get('page')) || 1
  };

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

  // OPTIMIZED: Create O(1) lookup maps for locations and categories
  // This replaces O(n) nested loops with instant lookups
  const { locationMap, categoryMap } = useMemo(() => {
    const locMap = new Map();
    const catMap = new Map();

    // Build location map: name -> id (includes provinces, districts, municipalities)
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

    // Build category map: name -> id (includes main categories and subcategories)
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

  // O(1) location lookup - instant instead of nested loops
  const selectedLocationId = useMemo(() => {
    if (searchFilters.location === 'all') return '';
    const id = locationMap.get(searchFilters.location);
    return id ? id.toString() : '';
  }, [searchFilters.location, locationMap]);

  // O(1) category lookup - instant instead of nested loops
  // If subcategory is selected, use that; otherwise use category
  const selectedCategoryId = useMemo(() => {
    if (searchFilters.subcategory) {
      const id = categoryMap.get(searchFilters.subcategory);
      return id ? id.toString() : '';
    }
    if (searchFilters.category === 'all' || !searchFilters.category) return '';
    const id = categoryMap.get(searchFilters.category);
    return id ? id.toString() : '';
  }, [searchFilters.category, searchFilters.subcategory, categoryMap]);

  // Load categories and locations
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const categoriesData = await ApiService.getCategories(true); // Fetch with subcategories
        setCategories(categoriesData);

        // OPTIMIZED: Fetch complete location hierarchy in a single API call
        // This replaces 85 separate API calls (1 for provinces + 7 for districts + 77 for municipalities)
        const locationHierarchy = await ApiService.getLocationHierarchy();
        setLocations(locationHierarchy);
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

        // Build search params
        const searchParams = {};
        if (searchFilters.search.trim()) searchParams.search = searchFilters.search.trim();

        // Category filtering: use parentCategoryId for parent categories to include all subcategories
        if (searchFilters.subcategory) {
          // Subcategory selected - filter by specific subcategory only
          searchParams.category = searchFilters.subcategory;
        } else if (searchFilters.category !== 'all') {
          // Parent category selected - use parentCategoryId to include all subcategories
          const parentCategory = categories.find(c => c.name === searchFilters.category);
          if (parentCategory) {
            searchParams.parentCategoryId = parentCategory.id;
            console.log(`🏷️ [SearchResults] Using parentCategoryId: ${parentCategory.id} for category: ${searchFilters.category}`);
          }
        }
        // Location filtering - use location_name for hierarchical filtering with recursive CTE
        // NOTE: area_ids, province_id, district_id, municipality_id are passed through SearchFiltersPanel
        // but we need to convert them to location names for the backend
        if (searchFilters.area_ids && searchFilters.area_ids !== 'all') {
          // Area IDs are comma-separated, just use the first one's name
          // The LocationHierarchyBrowser should handle this better by passing location name
          searchParams.area_ids = searchFilters.area_ids;
        } else if (searchFilters.province_id) {
          // Find province name from ID and use location_name
          const province = locations.find(l => l.id === parseInt(searchFilters.province_id));
          if (province) {
            searchParams.location_name = province.name;
            console.log('🗺️ [SearchResults] Province selected, using location_name:', province.name);
          }
        } else if (searchFilters.district_id) {
          // Find district name from ID and use location_name
          let districtName = null;
          for (const province of locations) {
            if (province.districts) {
              const district = province.districts.find(d => d.id === parseInt(searchFilters.district_id));
              if (district) {
                districtName = district.name;
                break;
              }
            }
          }
          if (districtName) {
            searchParams.location_name = districtName;
            console.log('🗺️ [SearchResults] District selected, using location_name:', districtName);
          }
        } else if (searchFilters.municipality_id) {
          // Find municipality name from ID and use location_name
          let municipalityName = null;
          for (const province of locations) {
            if (province.districts) {
              for (const district of province.districts) {
                if (district.municipalities) {
                  const municipality = district.municipalities.find(m => m.id === parseInt(searchFilters.municipality_id));
                  if (municipality) {
                    municipalityName = municipality.name;
                    break;
                  }
                }
              }
              if (municipalityName) break;
            }
          }
          if (municipalityName) {
            searchParams.location_name = municipalityName;
            console.log('🗺️ [SearchResults] Municipality selected, using location_name:', municipalityName);
          }
        } else if (searchFilters.location !== 'all') {
          // Use location_name for hierarchical filtering (includes all child locations)
          searchParams.location_name = searchFilters.location;
          console.log('🗺️ [SearchResults] Using location_name for hierarchical filtering:', searchFilters.location);
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

        // Add pagination
        const limit = 20;
        const offset = (searchFilters.page - 1) * limit;
        searchParams.limit = limit;
        searchParams.offset = offset;

        const response = await ApiService.getAds(searchParams);

        setAds(response.data);
        setTotalAds(response.pagination?.total || 0);
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
    // Only update if value actually changed
    if (searchFilters[field] == value) {
      return;
    }

    const newFilters = {
      ...searchFilters,
      [field]: value,
      page: 1 // Reset to page 1 when filters change
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
    if (filters.subcategory) urlParams.append('subcategory', filters.subcategory);
    if (filters.location !== 'all') urlParams.append('location', filters.location);
    if (filters.area_ids) urlParams.append('area_ids', filters.area_ids);
    if (filters.province_id) urlParams.append('province_id', filters.province_id);
    if (filters.district_id) urlParams.append('district_id', filters.district_id);
    if (filters.municipality_id) urlParams.append('municipality_id', filters.municipality_id);
    if (filters.ward) urlParams.append('ward', filters.ward);
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
      navigate(newUrl, { replace: true });
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
    searchFilters.subcategory || searchFilters.location !== 'all' ||
    searchFilters.minPrice || searchFilters.maxPrice ||
    searchFilters.condition !== 'all' || searchFilters.datePosted !== 'any' ||
    searchFilters.sortBy !== 'date' || searchFilters.sortOrder !== 'desc';

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

    // Show subcategory if exists, otherwise show category
    if (searchFilters.subcategory) {
      parts.push(searchFilters.subcategory);
    } else if (searchFilters.category && searchFilters.category !== 'all') {
      parts.push(searchFilters.category);
    }

    if (searchFilters.location && searchFilters.location !== 'all') parts.push(`in ${searchFilters.location}`);
    return parts.length > 0 ? `${parts.join(' ')} - Thulobazaar` : 'Search Results - Thulobazaar';
  };

  const generateMetaDescription = () => {
    let categoryText = 'items';

    // Show full category path for subcategories (e.g., "Mobile > Mobile Phones")
    if (searchFilters.subcategory) {
      categoryText = `${searchFilters.category} > ${searchFilters.subcategory}`;
    } else if (searchFilters.category !== 'all') {
      categoryText = searchFilters.category;
    }

    const location = searchFilters.location !== 'all' ? ` in ${searchFilters.location}` : ' across Nepal';
    return `Find ${categoryText}${location}. Browse ${ads.length} ads on Thulobazaar, Nepal's leading classifieds marketplace.`;
  };

  return (
    <div>
      {/* React 19 Native Metadata */}
      <title>{generatePageTitle()}</title>
        <meta name="description" content={generateMetaDescription()} />
        <meta name="keywords" content={`${searchFilters.category}${searchFilters.subcategory ? `, ${searchFilters.subcategory}` : ''}, ${searchFilters.location}, Nepal classifieds, ${searchFilters.search}`} />
        <link rel="canonical" href={`${window.location.origin}${location.pathname}${location.search}`} />

        {/* Open Graph tags */}
        <meta property="og:title" content={generatePageTitle()} />
        <meta property="og:description" content={generateMetaDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}${location.pathname}${location.search}`} />
      

      {/* Header */}
      <Header />


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
                      <path d="M7.615 15.23a7.615 7.615 0 1 1 6.1-3.054l2.966 2.967a1.088 1.088 0 0 1-1.539 1.538l-2.966-2.966a7.582 7.582 0 0 1-4.56 1.516zm5.44-7.615a5.44 5.44 0 1 1-10.88 0 5.44 5.44 0 0 1 10.88 0z" fill="white" fillRule="evenodd"></path>
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
            {/* Search Filters Panel */}
            <SearchFiltersPanel
              categories={categories}
              locations={locations}
              selectedCategory={selectedCategoryId}
              selectedLocation={selectedLocationId}
              priceRange={{
                min: searchFilters.minPrice || '',
                max: searchFilters.maxPrice || ''
              }}
              condition={searchFilters.condition === 'all' ? '' : searchFilters.condition}
              enableAreaFiltering={true}
              onLocationSelect={(selection) => {
                console.log('✨ [SearchResults] Location selected:', selection);

                // Clear all location filters first
                const newFilters = {
                  ...searchFilters,
                  location: 'all',
                  area_ids: '',
                  province_id: '',
                  district_id: '',
                  municipality_id: '',
                  ward: '',
                  page: 1
                };

                // Use location name instead of IDs for cleaner URLs
                if (selection && selection.name) {
                  newFilters.location = selection.name;
                  console.log('🗺️  [SearchResults] Location selected:', selection.name, `(type: ${selection.type})`);
                }

                console.log('✨ [SearchResults] Updating URL with filters:', newFilters);
                updateURL(newFilters);
              }}
              onCategoryChange={(categoryId) => {
                if (!categoryId) {
                  // Clear both category and subcategory
                  const newFilters = {
                    ...searchFilters,
                    category: 'all',
                    subcategory: '',
                    page: 1
                  };
                  updateURL(newFilters);
                  return;
                }

                const id = parseInt(categoryId);
                let parentCategoryName = '';
                let subcategoryName = '';

                // First check if it's a main category
                const mainCategory = categories.find(c => c.id === id);
                if (mainCategory) {
                  // Selected a main category
                  parentCategoryName = mainCategory.name;
                  subcategoryName = '';
                } else {
                  // Search in subcategories
                  for (const cat of categories) {
                    if (cat.subcategories && cat.subcategories.length > 0) {
                      const subcat = cat.subcategories.find(s => s.id === id);
                      if (subcat) {
                        // Selected a subcategory - track both parent and subcategory
                        parentCategoryName = cat.name;
                        subcategoryName = subcat.name;
                        break;
                      }
                    }
                  }
                }

                // Update filters with both category and subcategory
                const newFilters = {
                  ...searchFilters,
                  category: parentCategoryName || 'all',
                  subcategory: subcategoryName,
                  page: 1
                };
                updateURL(newFilters);
              }}
              onLocationChange={(locationId) => {
                if (!locationId) {
                  handleInputChange('location', 'all');
                  return;
                }

                // Search for location in hierarchical structure
                let locationName = 'all';
                const id = parseInt(locationId);

                // Search in provinces
                let found = locations.find(l => l.id === id);
                if (found) {
                  locationName = found.name;
                } else {
                  // Search in districts
                  for (const province of locations) {
                    if (province.districts) {
                      found = province.districts.find(d => d.id === id);
                      if (found) {
                        locationName = found.name;
                        break;
                      }
                    }
                  }

                  // Search in municipalities if not found
                  if (!found) {
                    for (const province of locations) {
                      if (province.districts) {
                        for (const district of province.districts) {
                          if (district.municipalities) {
                            found = district.municipalities.find(m => m.id === id);
                            if (found) {
                              locationName = found.name;
                              break;
                            }
                          }
                        }
                        if (found) break;
                      }
                    }
                  }
                }

                handleInputChange('location', locationName);
              }}
              onPriceRangeChange={(range) => {
                const newFilters = {
                  ...searchFilters,
                  minPrice: range.min || '',
                  maxPrice: range.max || ''
                };
                updateURL(newFilters);
              }}
              onConditionChange={(value) => handleInputChange('condition', value || 'all')}
              onClearFilters={clearAllFilters}
            />

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
                Search Results ({totalAds} ads found)
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

            {/* Results Counter */}
            {totalAds > 0 && (
              <div style={{
                padding: '16px 0',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Showing {((searchFilters.page - 1) * 20) + 1}-{Math.min(searchFilters.page * 20, totalAds)} of {totalAds} results
              </div>
            )}

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

            {/* Pagination */}
            {totalAds > 20 && (
              <Pagination
                currentPage={searchFilters.page}
                totalItems={totalAds}
                itemsPerPage={20}
                onPageChange={(page) => {
                  // Scroll to top
                  window.scrollTo({ top: 0, behavior: 'smooth' });

                  // Update URL with new page
                  const params = new URLSearchParams(location.search);
                  params.set('page', page);
                  navigate(`${location.pathname}?${params.toString()}`);
                }}
              />
            )}
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