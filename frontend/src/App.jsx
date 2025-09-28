import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Home from './components/Home';
import SearchResults from './components/SearchResults';
import AllAds from './components/AllAds';
import AdDetail from './components/AdDetail';
import PostAd from './components/PostAd';
import Dashboard from './components/Dashboard';
import EditAd from './components/EditAd';
import Browse from './components/Browse';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/all-ads" element={<AllAds />} />

          {/* SEO-friendly ad URLs with backward compatibility */}
          <Route path="/ad/:slug" element={<AdDetail />} />
          <Route path="/ad/:id" element={<AdDetail />} />

          {/* Browse pages - Bikroy-style URL structure */}
          <Route path="/ads" element={<Browse />} />
          <Route path="/ads/category/:categorySlug" element={<Browse />} />
          <Route path="/ads/:locationSlug" element={<Browse />} />
          <Route path="/ads/:locationSlug/:categorySlug" element={<Browse />} />

          <Route path="/post-ad" element={<PostAd />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/edit-ad/:id" element={<EditAd />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminPanel />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App