import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import ApiService from '../services/api';
import SimpleHeader from './SimpleHeader';
import AdCard from './AdCard';
import { parseBrowseUrl, generateMetaTitle, generateMetaDescription, generateBreadcrumbs } from '../utils/urlUtils';
import { parseBikroyStyleURL, getCategoryFromSlug } from '../utils/seoUtils';

function Browse() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Handle hierarchical URL patterns including subcategories
  const getPageParams = () => {
    const { locationSlug, categorySlug, subcategorySlug } = params;
    const pathname = window.location.pathname;

    console.log('🔍 Raw params:', { locationSlug, categorySlug, subcategorySlug });
    console.log('🔍 Pathname:', pathname);

    // Pattern: /ads/location/category/subcategory - 3 segments
    if (locationSlug && categorySlug && subcategorySlug) {
      console.log('🔍 Detected location + category + subcategory pattern');
      return {
        locationSlug,
        categorySlug,
        subcategorySlug,
        categoryName: getCategoryFromSlug(categorySlug),
        subcategoryName: getCategoryFromSlug(subcategorySlug)
      };
    }

    // Parse using Bikroy-style URL parser for backward compatibility
    const parsed = parseBikroyStyleURL(pathname);

    if (parsed.isValid) {
      console.log('🔍 Bikroy-style URL parsed:', parsed);
      // Convert category slug back to actual category name
      const categoryName = parsed.category ? getCategoryFromSlug(parsed.category) : null;
      return {
        locationSlug: parsed.location,
        categorySlug: parsed.category,
        subcategorySlug: null,
        categoryName: categoryName,
        subcategoryName: null
      };
    }

    // Fallback to original logic for backward compatibility
    // Pattern: /en/ads/category/vehicles - handled by route /ads/category/:categorySlug
    if (pathname.includes('/ads/category/') && categorySlug && !locationSlug) {
      console.log('🔍 Detected category-only pattern (legacy)');
      return { locationSlug: null, categorySlug: categorySlug, subcategorySlug: null, categoryName: getCategoryFromSlug(categorySlug), subcategoryName: null };
    }

    // Pattern: /ads/kathmandu/electronics - handled by route /ads/:locationSlug/:categorySlug
    if (locationSlug && categorySlug) {
      console.log('🔍 Detected location + category pattern');
      return { locationSlug: locationSlug, categorySlug: categorySlug, subcategorySlug: null, categoryName: getCategoryFromSlug(categorySlug), subcategoryName: null };
    }

    // Pattern: /ads/electronics - handled by route /ads/:locationSlug (could be location or category)
    if (locationSlug && !categorySlug) {
      console.log('🔍 Detected single parameter pattern');
      return { locationSlug: locationSlug, categorySlug: null, subcategorySlug: null, categoryName: null, subcategoryName: null };
    }

    // Pattern: /ads - handled by route /ads
    console.log('🔍 Detected base pattern');
    return { locationSlug: null, categorySlug: null, subcategorySlug: null, categoryName: null, subcategoryName: null };
  };

  const { locationSlug, categorySlug, subcategorySlug, categoryName, subcategoryName } = getPageParams();

  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentArea, setCurrentArea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalAds, setTotalAds] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
  }, [locationSlug, categorySlug, subcategorySlug, searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load categories and locations
      const [categoriesData, locationsData] = await Promise.all([
        ApiService.getCategories(true), // true = include subcategories
        ApiService.getLocations()
      ]);

      setCategories(categoriesData);
      setLocations(locationsData);

      // Determine actual category, subcategory, and location based on URL params
      let actualCategory = null;
      let actualSubcategory = null;
      let actualLocation = null;

      // Handle subcategory if present
      if (subcategoryName || subcategorySlug) {
        console.log('🔍 Looking for subcategory with name/slug:', subcategoryName, subcategorySlug);
        // Search for subcategory within categories
        for (const cat of categoriesData) {
          if (cat.subcategories) {
            const subcat = cat.subcategories.find(sub => {
              // Try matching by name (exact or case-insensitive)
              if (subcategoryName && (sub.name === subcategoryName || sub.name.toLowerCase() === subcategoryName.toLowerCase())) {
                return true;
              }
              // Try matching by slug
              if (subcategorySlug && sub.slug === subcategorySlug) {
                return true;
              }
              // Try generating slug from name and comparing
              const generatedSlug = sub.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
              if (subcategorySlug && generatedSlug === subcategorySlug) {
                return true;
              }
              return false;
            });
            if (subcat) {
              actualSubcategory = subcat;
              actualCategory = cat; // Also set parent category
              console.log('🔍 Found subcategory:', actualSubcategory, 'in category:', actualCategory);
              break;
            }
          }
        }
      }

      // Handle category (only if no subcategory was found)
      if ((categoryName || categorySlug) && !actualSubcategory) {
        console.log('🔍 Looking for category with name/slug:', categoryName, categorySlug);
        console.log('🔍 Available categories:', categoriesData.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug })));

        actualCategory = categoriesData.find(cat => {
          // Try matching by name (exact or case-insensitive)
          if (categoryName && (cat.name === categoryName || cat.name.toLowerCase() === categoryName.toLowerCase())) {
            return true;
          }
          // Try matching by slug
          if (categorySlug && cat.slug === categorySlug) {
            return true;
          }
          // Try generating slug from name and comparing
          const generatedSlug = cat.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
          if (categorySlug && generatedSlug === categorySlug) {
            return true;
          }
          return false;
        });

        console.log('🔍 Found category:', actualCategory);
      }

      if (locationSlug) {
        console.log('🔍 Looking for location with slug:', locationSlug);
        // Search for location - try by slug or by generating slug from name
        actualLocation = locationsData.find(loc => {
          if (loc.slug === locationSlug) return true;
          // Generate slug from location name and compare
          const generatedSlug = loc.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
          return generatedSlug === locationSlug;
        });

        // If not found in provinces/districts/municipalities, search all location levels (including areas)
        if (!actualLocation) {
          console.log('🔍 Not found in hierarchy, searching all locations (including areas)');
          // Convert slug to search query (e.g., "dilli-bazaar" -> "Dilli Bazaar")
          const searchQuery = locationSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const searchResults = await ApiService.searchAllLocations(searchQuery, 5);
          console.log('🔍 Search results for areas:', searchResults);

          if (searchResults.length > 0) {
            // Find exact match or close match
            actualLocation = searchResults.find(loc => {
              const locSlug = loc.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
              return locSlug === locationSlug;
            }) || searchResults[0]; // Use first result if no exact match
            console.log('🔍 Found location in search-all:', actualLocation);
          }
        }

        // If still not found as location and no categorySlug, check if it's a category
        if (!actualLocation && !categorySlug) {
          actualCategory = categoriesData.find(cat => {
            if (cat.slug === locationSlug) return true;
            const generatedSlug = cat.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
            return generatedSlug === locationSlug;
          });
        }

        console.log('🔍 Found location:', actualLocation);
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
      setCurrentSubcategory(actualSubcategory);
      setCurrentLocation(actualLocation);

      // Prepare search parameters
      const searchOptions = {
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE
      };

      // Use subcategory for filtering if available, otherwise use parent category ID to include all subcategories
      if (actualSubcategory) {
        // Searching for specific subcategory only
        searchOptions.category = actualSubcategory.name;
        console.log('📡 API will use SUBCATEGORY NAME:', actualSubcategory.name);
      } else if (actualCategory) {
        // Searching for parent category - include ALL subcategories
        searchOptions.parentCategoryId = actualCategory.id;
        console.log('📡 API will use PARENT CATEGORY ID (includes all subcategories):', actualCategory.id);
      } else if (subcategoryName) {
        // Fallback: use subcategory name directly if subcategory object not found
        searchOptions.category = subcategoryName;
        console.log('📡 API will use SUBCATEGORY NAME (fallback):', subcategoryName);
      } else if (categoryName) {
        // Fallback: use category name directly if category object not found
        searchOptions.category = categoryName;
        console.log('📡 API will use category NAME (fallback):', categoryName);
      } else {
        console.log('📡 API will use NO CATEGORY');
      }

      // Handle location - use location_name for hierarchical filtering (includes all child locations)
      // Using location_name instead of location ID enables the backend recursive CTE query
      if (actualLocation) {
        searchOptions.location_name = actualLocation.name;
        console.log('📡 API will search for location_name (hierarchical):', actualLocation.name);
      } else if (locationSlug) {
        // Convert slug back to a name format (capitalize, replace hyphens)
        const locationName = locationSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        searchOptions.location_name = locationName;
        console.log('📡 API will search for location_name:', locationName);
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
            {/* Show subcategory if exists, otherwise show category */}
            {currentSubcategory && currentLocation
              ? `${currentSubcategory.name} in ${currentLocation.name}`
              : currentSubcategory
                ? currentSubcategory.name
                : currentCategory && currentLocation
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
              onClick={() => navigate(`/${language}/post-ad`)}
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
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