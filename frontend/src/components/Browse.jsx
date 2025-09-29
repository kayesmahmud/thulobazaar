import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import SimpleHeader from './SimpleHeader';
import { parseBrowseUrl, generateMetaTitle, generateMetaDescription, generateBreadcrumbs } from '../utils/urlUtils';
import { parseBikroyStyleURL, getCategoryFromSlug } from '../utils/seoUtils';

function Browse() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle Bikroy-style URL patterns
  const getPageParams = () => {
    const { locationSlug, categorySlug } = params;
    const pathname = window.location.pathname;

    console.log('🔍 Raw params:', { locationSlug, categorySlug });
    console.log('🔍 Pathname:', pathname);

    // Parse using Bikroy-style URL parser
    const parsed = parseBikroyStyleURL(pathname);

    if (parsed.isValid) {
      console.log('🔍 Bikroy-style URL parsed:', parsed);
      // Convert category slug back to actual category name
      const categoryName = parsed.category ? getCategoryFromSlug(parsed.category) : null;
      return {
        locationSlug: parsed.location,
        categorySlug: parsed.category,
        categoryName: categoryName
      };
    }

    // Fallback to original logic for backward compatibility
    // Pattern: /ads/category/vehicles - handled by route /ads/category/:categorySlug
    if (pathname.startsWith('/ads/category/') && categorySlug && !locationSlug) {
      console.log('🔍 Detected category-only pattern (legacy)');
      return { locationSlug: null, categorySlug: categorySlug, categoryName: getCategoryFromSlug(categorySlug) };
    }

    // Pattern: /ads/kathmandu/electronics - handled by route /ads/:locationSlug/:categorySlug
    if (locationSlug && categorySlug) {
      console.log('🔍 Detected location + category pattern');
      return { locationSlug: locationSlug, categorySlug: categorySlug, categoryName: getCategoryFromSlug(categorySlug) };
    }

    // Pattern: /ads/electronics - handled by route /ads/:locationSlug (could be location or category)
    if (locationSlug && !categorySlug) {
      console.log('🔍 Detected single parameter pattern');
      return { locationSlug: locationSlug, categorySlug: null, categoryName: null };
    }

    // Pattern: /ads - handled by route /ads
    console.log('🔍 Detected base pattern');
    return { locationSlug: null, categorySlug: null, categoryName: null };
  };

  const { locationSlug, categorySlug, categoryName } = getPageParams();

  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalAds, setTotalAds] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
  }, [locationSlug, categorySlug, searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load categories and locations first
      const [categoriesData, locationsData] = await Promise.all([
        ApiService.getCategories(),
        ApiService.getLocations()
      ]);

      setCategories(categoriesData);
      setLocations(locationsData);

      // Determine actual category and location based on URL params
      let actualCategory = null;
      let actualLocation = null;

      if (categoryName) {
        console.log('🔍 Looking for category with name:', categoryName);
        console.log('🔍 Available categories:', categoriesData.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug })));
        // First try exact name match
        actualCategory = categoriesData.find(cat => cat.name === categoryName);

        // If no exact match, try case-insensitive match
        if (!actualCategory) {
          actualCategory = categoriesData.find(cat =>
            cat.name.toLowerCase() === categoryName.toLowerCase()
          );
        }

        // If still no match and we have a slug, try by slug
        if (!actualCategory && categorySlug) {
          actualCategory = categoriesData.find(cat => cat.slug === categorySlug);
        }

        console.log('🔍 Found category:', actualCategory);
      }

      if (locationSlug) {
        // First check if locationSlug is actually a location
        actualLocation = locationsData.find(loc => loc.slug === locationSlug);

        // If not found as location and no categorySlug, check if it's a category
        if (!actualLocation && !categorySlug) {
          actualCategory = categoriesData.find(cat => cat.slug === locationSlug);
        }
      }

      console.log('🔍 Browse Debug - DETAILED:', {
        'URL pathname': window.location.pathname,
        locationSlug,
        categorySlug,
        categoryName,
        'getCategoryFromSlug result': categorySlug ? getCategoryFromSlug(categorySlug) : 'no slug',
        actualCategory,
        actualLocation,
        'Available categories': categoriesData.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug })),
        'API will receive category': actualCategory ? actualCategory.id : (categoryName ? categoryName : 'NO CATEGORY')
      });

      setCurrentCategory(actualCategory);
      setCurrentLocation(actualLocation);

      // Prepare search parameters
      const searchOptions = {
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE
      };

      if (actualCategory) {
        searchOptions.category = actualCategory.id;
        console.log('📡 API will use category ID:', actualCategory.id, 'for category:', actualCategory.name);
      } else if (categoryName) {
        // Fallback: use category name directly if category object not found
        searchOptions.category = categoryName;
        console.log('📡 API will use category NAME (fallback):', categoryName);
      } else {
        console.log('📡 API will use NO CATEGORY');
      }

      if (actualLocation) {
        searchOptions.location = actualLocation.id;
      }

      // Add other search params (price range, sorting, etc.)
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const sortBy = searchParams.get('sortBy');

      if (minPrice) searchOptions.minPrice = minPrice;
      if (maxPrice) searchOptions.maxPrice = maxPrice;
      if (sortBy) searchOptions.sortBy = sortBy;

      // Load ads
      console.log('📡 Making API call with options:', searchOptions);
      const adsResponse = await ApiService.getAds(searchOptions);
      console.log('📡 API Response received:', adsResponse);
      console.log('📡 Response data:', adsResponse.data);
      console.log('📡 Response pagination:', adsResponse.pagination);
      console.log('📡 Response total from pagination:', adsResponse.pagination?.total);
      console.log('📡 Setting ads to:', adsResponse.data || []);
      console.log('📡 Setting totalAds to:', adsResponse.pagination?.total || 0);

      setAds(adsResponse.data || []);
      setTotalAds(adsResponse.pagination?.total || 0);
      setTotalPages(Math.ceil((adsResponse.pagination?.total || 0) / ITEMS_PER_PAGE));

      // Final state verification
      console.log('🔄 After setting state:');
      console.log('🔄 ads will be set to:', adsResponse.data || []);
      console.log('🔄 ads.length:', (adsResponse.data || []).length);
      console.log('🔄 totalAds will be set to:', adsResponse.pagination?.total || 0);

    } catch (err) {
      console.error('Error loading browse data:', err);
      setError('Failed to load ads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAdClick = (ad) => {
    const titleSlug = ad.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    const locationSlug = ad.location_name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    navigate(`/ad/${titleSlug}-${locationSlug}-${ad.id}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Generate page title and meta data
  const pageTitle = generateMetaTitle({
    categoryName: currentCategory?.name,
    locationName: currentLocation?.name,
    siteName: 'Thulobazaar'
  });

  const pageDescription = generateMetaDescription({
    categoryName: currentCategory?.name,
    locationName: currentLocation?.name,
    count: totalAds
  });

  // Generate breadcrumbs
  const breadcrumbs = generateBreadcrumbs({
    categoryName: currentCategory?.name,
    locationName: currentLocation?.name
  });

  // Update document title
  useEffect(() => {
    document.title = pageTitle;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', pageDescription);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = pageDescription;
      document.head.appendChild(metaDescription);
    }
  }, [pageTitle, pageDescription]);

  return (
    <div>
      <SimpleHeader />

      <div className="browse-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Breadcrumbs */}
        <nav style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {index > 0 && <span style={{ margin: '0 8px' }}>›</span>}
                {crumb.active ? (
                  <span style={{ color: '#1e293b', fontWeight: '500' }}>{crumb.label}</span>
                ) : (
                  <a
                    href={crumb.url}
                    onClick={(e) => { e.preventDefault(); navigate(crumb.url); }}
                    style={{ color: '#3b82f6', textDecoration: 'none' }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {crumb.label}
                  </a>
                )}
              </span>
            ))}
          </div>
        </nav>

        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            {currentCategory && currentLocation
              ? `${currentCategory.name} in ${currentLocation.name}`
              : currentCategory
                ? currentCategory.name
                : currentLocation
                  ? `All Ads in ${currentLocation.name}`
                  : 'All Ads'
            }
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            {totalAds} ads found
          </p>
        </div>

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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
            <p>Loading ads...</p>
          </div>
        ) : ads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No ads found</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Try adjusting your search criteria or check back later.
            </p>
            <button
              onClick={() => navigate('/post-ad')}
              style={{
                backgroundColor: '#dc1e4a',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Post First Ad
            </button>
          </div>
        ) : (
          <>
            {/* Ads Grid */}
            <div className="main-content-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="ad-card"
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
                      <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1e293b',
                        lineHeight: '1.3'
                      }}>
                        {ad.title}
                      </h3>
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
                    alignItems: 'center'
                  }}>
                    <span>📍 {ad.location_name}</span>
                    <span>{formatDate(ad.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '40px'
              }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: currentPage === page ? '#dc1e4a' : 'white',
                        color: currentPage === page ? 'white' : '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Browse;