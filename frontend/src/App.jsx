import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './App.css'
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/common/Toast';
import PageLoader from './components/common/PageLoader';

// Helper component for redirecting with params
const RedirectWithParams = ({ to }) => {
  const params = useParams();
  const path = to.replace(/:(\w+)/g, (_, key) => params[key]);
  return <Navigate to={path} replace />;
};

// Lazy-loaded page components for code splitting
const Home = lazy(() => import('./components/Home'));
const SearchResults = lazy(() => import('./components/SearchResults'));
const AllAds = lazy(() => import('./components/AllAds'));
const AdDetail = lazy(() => import('./components/AdDetail'));
const PostAd = lazy(() => import('./components/PostAd'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const EditAd = lazy(() => import('./components/EditAd'));
const Browse = lazy(() => import('./components/Browse'));
const NearbyAds = lazy(() => import('./components/NearbyAds'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const EditorLogin = lazy(() => import('./components/EditorLogin'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const EditorDashboard = lazy(() => import('./components/EditorDashboard'));
const Profile = lazy(() => import('./components/Profile'));
const ShopProfile = lazy(() => import('./components/ShopProfile'));
const SellerProfile = lazy(() => import('./components/SellerProfile'));
const PromotionSelectionPage = lazy(() => import('./pages/PromotionSelectionPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <LanguageProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
            {/* Root redirect to English */}
            <Route path="/" element={<Navigate to="/en" replace />} />

            {/* Language-prefixed routes */}
            <Route path="/:lang">
              {/* Home page */}
              <Route index element={<Home />} />

              {/* Other routes */}
              <Route path="search" element={<SearchResults />} />
              <Route path="all-ads" element={<AllAds />} />
              <Route path="post-ad" element={<PostAd />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="editor" element={<EditorLogin />} />
              <Route path="editor/dashboard" element={<EditorDashboard />} />
              <Route path="admin" element={<AdminLogin />} />
              <Route path="edit-ad/:id" element={<EditAd />} />
              <Route path="profile" element={<Profile />} />

              {/* Browse pages - Hierarchical URL structure */}
              <Route path="ads" element={<Browse />} />
              <Route path="ads/nearby" element={<NearbyAds />} />
              <Route path="ads/category/:categorySlug" element={<Browse />} />
              {/* 3-segment: /ads/location/category/subcategory */}
              <Route path="ads/:locationSlug/:categorySlug/:subcategorySlug" element={<Browse />} />
              {/* 2-segment: /ads/location/category */}
              <Route path="ads/:locationSlug/:categorySlug" element={<Browse />} />
              {/* 1-segment: /ads/location */}
              <Route path="ads/:locationSlug" element={<Browse />} />

              {/* SEO-friendly ad URLs */}
              <Route path="ad/:slug" element={<AdDetail />} />

              {/* Ad Promotion Routes */}
              <Route path="promote/:adId" element={<PromotionSelectionPage />} />
              <Route path="payment/:adId" element={<PaymentPage />} />
              <Route path="payment-success" element={<PaymentSuccessPage />} />

              {/* Shop and Seller Profile pages */}
              <Route path="shop/:shopSlug" element={<ShopProfile />} />
              <Route path="seller/:sellerSlug" element={<SellerProfile />} />
            </Route>

            {/* Admin routes (no language prefix) */}
            <Route path="/admin/dashboard" element={<AdminPanel />} />

            {/* Fallback routes without language prefix - redirect to /en */}
            <Route path="/ads" element={<Navigate to="/en/ads" replace />} />
            <Route path="/ads/nearby" element={<Navigate to="/en/ads/nearby" replace />} />
            <Route path="/ads/:locationSlug/:categorySlug/:subcategorySlug" element={<RedirectWithParams to="/en/ads/:locationSlug/:categorySlug/:subcategorySlug" />} />
            <Route path="/ads/:locationSlug/:categorySlug" element={<RedirectWithParams to="/en/ads/:locationSlug/:categorySlug" />} />
            <Route path="/ads/:locationSlug" element={<RedirectWithParams to="/en/ads/:locationSlug" />} />
            <Route path="/ad/:slug" element={<RedirectWithParams to="/en/ad/:slug" />} />
            <Route path="/search" element={<Navigate to="/en/search" replace />} />
            <Route path="/post-ad" element={<Navigate to="/en/post-ad" replace />} />
              </Routes>
            </Suspense>
          </LanguageProvider>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App