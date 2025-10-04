import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Home from './components/Home';
import SearchResults from './components/SearchResults';
import AllAds from './components/AllAds';
import AdDetail from './components/AdDetail';
import PostAd from './components/PostAd';
import Dashboard from './components/Dashboard';
import EditAd from './components/EditAd';
import Browse from './components/Browse';
import NearbyAds from './components/NearbyAds';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import EditorDashboard from './components/EditorDashboard';
import Profile from './components/Profile';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/common/Toast';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <LanguageProvider>
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
            </Route>

            {/* Admin routes (no language prefix) */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminPanel />} />
            </Routes>
          </LanguageProvider>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App