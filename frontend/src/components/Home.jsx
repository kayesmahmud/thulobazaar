import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdCard from './AdCard';
import ApiService from '../services/api';
import Header from './Header';
import RecentlyViewed from './RecentlyViewed';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { generateBikroyStyleURL, getCategorySlug } from '../utils/seoUtils';

function Home() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    search: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [adsResponse, categoriesData] = await Promise.all([
          ApiService.getAds(),
          ApiService.getCategories()
        ]);

        setAds(adsResponse.data);
        setCategories(categoriesData);
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError('Failed to load data. Please check if your backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    // Only use search term from the simple search bar
    const searchParams = new URLSearchParams();
    if (searchFilters.search.trim()) {
      searchParams.append('search', searchFilters.search.trim());
    }

    // Navigate to search results page with language prefix
    const queryString = searchParams.toString();
    navigate(`/${language}/search${queryString ? `?${queryString}` : ''}`);
  };

  const handleInputChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePostAdClick = () => {
    if (isAuthenticated) {
      navigate(`/${language}/post-ad`);
    } else {
      // This will be handled by the Header component's auth modal
      navigate(`/${language}`);
    }
  };


  if (loading || authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔄 Loading Thulobazaar...
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
        <h2>⚠️ Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>Thulobazaar - Buy, Sell, and Rent Across Nepal</title>
        <meta name="description" content="Nepal's leading classifieds marketplace. Buy and sell electronics, vehicles, real estate, and more. Post free ads and connect with buyers across Nepal." />
        <meta name="keywords" content="Nepal classifieds, buy sell Nepal, online marketplace Nepal, free ads Nepal, Thulobazaar" />
        <link rel="canonical" href={`${window.location.origin}/${language}`} />

        {/* Open Graph tags */}
        <meta property="og:title" content="Thulobazaar - Buy, Sell, and Rent Across Nepal" />
        <meta property="og:description" content="Nepal's leading classifieds marketplace. Buy and sell electronics, vehicles, real estate, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/${language}`} />
        <meta property="og:site_name" content="Thulobazaar" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Thulobazaar - Buy, Sell, and Rent Across Nepal" />
        <meta name="twitter:description" content="Nepal's leading classifieds marketplace. Buy and sell electronics, vehicles, real estate, and more." />

        {/* Website schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Thulobazaar",
            "url": `${window.location.origin}`,
            "description": "Nepal's leading classifieds marketplace",
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${window.location.origin}/${language}/search?search={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>

      {/* Header */}
      <Header />

      {/* Search Section */}
      <div className="search-section">
        <div className="search-content">
          <div className="search-header">
            <h1 className="search-title">Buy anything, Sell anything</h1>
            <p className="search-subtitle">Buy, Sell, and Rent Across Nepal</p>
          </div>

          {/* Simple Search Bar - Like Bikroy.com */}
          <div className="search-bar-container">
            <form className="search-form" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
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
                      <path d="M7.615 15.23a7.615 7.615 0 1 1 6.1-3.054l2.966 2.967a1.088 1.088 0 0 1-1.539 1.538l-2.966-2.966a7.582 7.582 0 0 1-4.56 1.516zm5.44-7.615a5.44 5.44 0 1 1-10.88 0 5.44 5.44 0 0 1 10.88 0z" fill="white" fillRule="evenodd"></path>
                    </svg>
                  </div>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* Categories Section - Now with real data */}
      <section className="categories-section">
        <h2 className="section-title">Browse items by category</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <div
              key={category.id}
              className="category-card"
              onClick={() => {
                const categorySlug = getCategorySlug(category.name).toLowerCase();
                navigate(`/${language}/ads/category/${categorySlug}`);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-name">{category.name}</div>
              <div className="category-count">Browse ads</div>
            </div>
          ))}
        </div>
      </section>


      {/* Featured Ads */}
      <section className="featured-section">
        <div className="featured-header">
          <h2 className="section-title">Featured Ads</h2>
          <div className="nav-buttons">
            <button className="nav-btn">‹</button>
            <button className="nav-btn">›</button>
          </div>
        </div>

        <div className="featured-grid">
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No ads found</h3>
              <p style={{ margin: 0 }}>
                No ads available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="quick-links-section">
        <div className="quick-links-content">
          <h2 className="section-title">Quick links</h2>
          <div className="quick-links-grid">
            <div className="quick-links-column">
              <h4>61,044 ads in Electronics</h4>
              <ul className="quick-links-list">
                <li><a href="#">Desktop Computers | Laptops</a></li>
                <li><a href="#">TVs | Cameras, Camcorders & Accessories</a></li>
                <li><a href="#">Audio & Sound Systems</a></li>
              </ul>
            </div>

            <div className="quick-links-column">
              <h4>14,960 ads in Property</h4>
              <ul className="quick-links-list">
                <li><a href="#">Apartments For Sale | Land</a></li>
                <li><a href="#">Apartment Rentals</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Inspired by Bikroy.com */}
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
  )
}

export default Home;