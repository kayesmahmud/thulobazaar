import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import './App.css'
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/common/Toast';
import PageLoader from './components/common/PageLoader';

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
              <Route path="editor" element={<EditorDashboard />} />
              <Route path="edit-ad/:id" element={<EditAd />} />
              <Route path="profile" element={<Profile />} />

              {/* Browse pages - Bikroy-style URL structure */}
              <Route path="ads" element={<Browse />} />
              <Route path="ads/nearby" element={<NearbyAds />} />
              <Route path="ads/:locationSlug" element={<Browse />} />
              <Route path="ads/:locationSlug/:categorySlug" element={<Browse />} />
              <Route path="ads/category/:categorySlug" element={<Browse />} />

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
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminPanel />} />
              </Routes>
            </Suspense>
          </LanguageProvider>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App