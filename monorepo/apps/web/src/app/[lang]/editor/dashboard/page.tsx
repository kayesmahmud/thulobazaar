'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { AdWithDetails } from '@thulobazaar/types';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

// Sidebar menu items for Editor
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ads', label: 'Review Ads', icon: '📝' },
  { id: 'business', label: 'Business Verifications', icon: '🏢' },
  { id: 'individual', label: 'Individual Verifications', icon: '👤' },
  { id: 'activity', label: 'Activity Logs', icon: '📋' },
  { id: 'users', label: 'Users', icon: '👥' },
];

interface EditorStats {
  totalAds: number;
  pendingAds: number;
  activeAds: number;
  rejectedAds: number;
  pendingVerifications: number;
}

interface VerificationRequest {
  id: number;
  type: 'business' | 'individual';
  status: string;
  created_at: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export default function EditorDashboard() {
  const router = useRouter();
  const { logout } = useStaffAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dashboard data
  const [stats, setStats] = useState<EditorStats>({
    totalAds: 0,
    pendingAds: 0,
    activeAds: 0,
    rejectedAds: 0,
    pendingVerifications: 0,
  });

  const [ads, setAds] = useState<AdWithDetails[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [selectedAdStatus, setSelectedAdStatus] = useState('pending');

  // Load data based on active section
  useEffect(() => {
    loadSectionData(activeSection);
  }, [activeSection]);

  const loadSectionData = async (section: string) => {
    setLoading(true);
    setError('');

    try {
      if (section === 'dashboard') {
        await loadEditorStats();
      } else if (section === 'ads') {
        await loadAds();
      } else if (section === 'business' || section === 'individual') {
        await loadVerifications();
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadEditorStats = async () => {
    try {
      const response = await apiClient.getEditorStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAds = async (status?: string) => {
    try {
      const response = await apiClient.getAllAdsForReview({
        status: status || selectedAdStatus,
        limit: 100,
      });
      if (response.success && response.data) {
        setAds(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const loadVerifications = async () => {
    try {
      const response = await apiClient.getPendingVerifications();
      if (response.success && response.data) {
        setVerifications(response.data);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
    }
  };

  const handleApproveAd = async (adId: number) => {
    if (!confirm('Are you sure you want to approve this ad?')) return;

    try {
      const response = await apiClient.approveAd(adId);
      if (response.success) {
        alert('Ad approved successfully!');
        await loadAds();
        await loadEditorStats();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to approve ad');
    }
  };

  const handleRejectAd = async (adId: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await apiClient.rejectAd(adId, reason);
      if (response.success) {
        alert('Ad rejected successfully!');
        await loadAds();
        await loadEditorStats();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to reject ad');
    }
  };

  const handleReviewVerification = async (
    verificationId: number,
    type: 'business' | 'individual',
    action: 'approve' | 'reject'
  ) => {
    let reason: string | null = null;

    if (action === 'reject') {
      reason = prompt('Please provide a reason for rejection:');
      if (!reason) return;
    } else {
      if (!confirm(`Are you sure you want to approve this ${type} verification?`)) return;
    }

    try {
      const response = await apiClient.reviewVerification(
        verificationId,
        type,
        action,
        reason || undefined
      );
      if (response.success) {
        alert(`Verification ${action}d successfully!`);
        await loadVerifications();
        await loadEditorStats();
      }
    } catch (error: any) {
      alert(error.message || `Failed to ${action} verification`);
    }
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardContent stats={stats} onRefresh={loadEditorStats} />;
      case 'ads':
        return (
          <ReviewAdsContent
            ads={ads}
            selectedStatus={selectedAdStatus}
            onStatusChange={(status) => {
              setSelectedAdStatus(status);
              loadAds(status);
            }}
            onApprove={handleApproveAd}
            onReject={handleRejectAd}
          />
        );
      case 'business':
        return (
          <BusinessVerificationsContent
            verifications={verifications.filter(v => v.type === 'business')}
            onReview={handleReviewVerification}
          />
        );
      case 'individual':
        return (
          <IndividualVerificationsContent
            verifications={verifications.filter(v => v.type === 'individual')}
            onReview={handleReviewVerification}
          />
        );
      case 'activity':
        return <ActivityLogsContent />;
      case 'users':
        return <UsersContent />;
      default:
        return <DashboardContent stats={stats} onRefresh={loadEditorStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-10`}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold text-green-600">Editor Panel</h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === item.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {isSidebarOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {menuItems.find((item) => item.id === activeSection)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Editor User</span>
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              E
            </div>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to logout?')) {
                  await logout();
                  router.push('/en');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200"
              title="Logout"
            >
              <span className="text-lg">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </main>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ stats, onRefresh }: { stats: EditorStats; onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 gap-6">
        <StatCard icon="📝" title="Total Ads" value={stats.totalAds} color="blue" />
        <StatCard icon="⏳" title="Pending Ads" value={stats.pendingAds} color="yellow" />
        <StatCard icon="✅" title="Pending Verifications" value={stats.pendingVerifications} color="green" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 laptop:grid-cols-2 gap-6">
        <div className="card-elevated">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Today's Tasks</h3>
            <button onClick={onRefresh} className="btn-outline-primary px-3 py-1 text-sm">
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            <TaskItem
              icon="📝"
              title="Review pending ads"
              count={stats.pendingAds}
              color="yellow"
            />
            <TaskItem
              icon="✅"
              title="Pending verifications"
              count={stats.pendingVerifications}
              color="green"
            />
            <TaskItem
              icon="❌"
              title="Rejected ads"
              count={stats.rejectedAds}
              color="red"
            />
          </div>
        </div>

        <div className="card-elevated">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="space-y-3">
            <StatItem label="Total Ads" value={stats.totalAds.toString()} />
            <StatItem label="Active Ads" value={stats.activeAds.toString()} />
            <StatItem label="Rejected Ads" value={stats.rejectedAds.toString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Review Ads Content Component
interface ReviewAdsContentProps {
  ads: AdWithDetails[];
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onApprove: (adId: number) => void;
  onReject: (adId: number) => void;
}

function ReviewAdsContent({ ads, selectedStatus, onStatusChange, onApprove, onReject }: ReviewAdsContentProps) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card-elevated">
        <div className="flex flex-wrap gap-3">
          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ads List */}
      <div className="space-y-4">
        {ads.length === 0 ? (
          <div className="card-elevated text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">📝</p>
            <p className="font-semibold">No ads to review</p>
            <p className="text-sm text-muted">Ads with status "{selectedStatus}" will appear here</p>
          </div>
        ) : (
          ads.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              onApprove={() => onApprove(ad.id)}
              onReject={() => onReject(ad.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Ad Card Component
function AdCard({ ad, onApprove, onReject }: { ad: AdWithDetails; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="card-elevated">
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0">
          {ad.images && ad.images[0] ? (
            <img
              src={ad.images[0]}
              alt={ad.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{ad.title}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ad.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
            <span>💰 {formatPrice(ad.price)}</span>
            <span>📍 {ad.location?.name || 'N/A'}</span>
            <span>📅 {formatDateTime(ad.created_at)}</span>
            <span className={`px-2 py-1 rounded ${
              ad.status === 'active' ? 'bg-green-100 text-green-700' :
              ad.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              ad.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {ad.status}
            </span>
          </div>

          {/* Actions */}
          {ad.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={onApprove} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                ✅ Approve
              </button>
              <button onClick={onReject} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                ❌ Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Business Verifications Content Component
interface VerificationsContentProps {
  verifications: VerificationRequest[];
  onReview: (id: number, type: 'business' | 'individual', action: 'approve' | 'reject') => void;
}

function BusinessVerificationsContent({ verifications, onReview }: VerificationsContentProps) {
  const [filter, setFilter] = useState('pending');

  const filteredVerifications = verifications.filter(v =>
    filter === 'all' || v.status === filter
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card-elevated">
        <div className="flex flex-wrap gap-3">
          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Requests */}
      <div className="space-y-4">
        {filteredVerifications.length === 0 ? (
          <div className="card-elevated text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🏢</p>
            <p className="font-semibold">No business verification requests</p>
          </div>
        ) : (
          filteredVerifications.map((verification) => (
            <BusinessVerificationCard
              key={verification.id}
              verification={verification}
              onApprove={() => onReview(verification.id, 'business', 'approve')}
              onReject={() => onReview(verification.id, 'business', 'reject')}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Individual Verifications Content Component
function IndividualVerificationsContent({ verifications, onReview }: VerificationsContentProps) {
  const [filter, setFilter] = useState('pending');

  const filteredVerifications = verifications.filter(v =>
    filter === 'all' || v.status === filter
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card-elevated">
        <div className="flex flex-wrap gap-3">
          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Requests */}
      <div className="space-y-4">
        {filteredVerifications.length === 0 ? (
          <div className="card-elevated text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">👤</p>
            <p className="font-semibold">No individual verification requests</p>
          </div>
        ) : (
          filteredVerifications.map((verification: any) => (
            <IndividualVerificationCard
              key={verification.id}
              verification={verification}
              onApprove={() => onReview(verification.id, 'individual', 'approve')}
              onReject={() => onReview(verification.id, 'individual', 'reject')}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Individual Verification Card Component (shows all details and images)
// Business Verification Card Component
function BusinessVerificationCard({
  verification,
  onApprove,
  onReject
}: {
  verification: any;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [showDocument, setShowDocument] = useState(false);

  return (
    <div className="card-elevated">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            {verification.business_name || 'Unknown Business'}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{verification.email}</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
              🏢 Business Verification
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              verification.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              verification.status === 'approved' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {verification.status}
            </span>
            <span className="text-xs text-gray-500">
              {formatDateTime(verification.created_at)}
            </span>
          </div>
        </div>

        {verification.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              ✅ Approve
            </button>
            <button
              onClick={onReject}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              ❌ Reject
            </button>
          </div>
        )}
      </div>

      {/* Business Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Business Name</p>
          <p className="font-medium">{verification.business_name}</p>
        </div>
        {verification.business_category && (
          <div>
            <p className="text-sm text-gray-600">Business Category</p>
            <p className="font-medium">{verification.business_category}</p>
          </div>
        )}
        {verification.business_phone && (
          <div>
            <p className="text-sm text-gray-600">Business Phone</p>
            <p className="font-medium">{verification.business_phone}</p>
          </div>
        )}
        {verification.business_website && (
          <div>
            <p className="text-sm text-gray-600">Business Website</p>
            <a
              href={verification.business_website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:text-primary-hover"
            >
              {verification.business_website}
            </a>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-600">User ID</p>
          <p className="font-medium">#{verification.user_id}</p>
        </div>
      </div>

      {/* Business Description */}
      {verification.business_description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Business Description</p>
          <p className="text-sm bg-gray-50 p-3 rounded-lg">{verification.business_description}</p>
        </div>
      )}

      {/* Business Address */}
      {verification.business_address && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Business Address</p>
          <p className="text-sm bg-gray-50 p-3 rounded-lg">{verification.business_address}</p>
        </div>
      )}

      {/* Business License Document */}
      {verification.business_license_document && (
        <div>
          <button
            onClick={() => setShowDocument(!showDocument)}
            className="text-sm font-semibold text-primary hover:text-primary-hover mb-3"
          >
            {showDocument ? '▼ Hide License Document' : '▶ View License Document'}
          </button>

          {showDocument && (
            <div className="mt-3">
              <p className="text-sm font-semibold mb-2">Business License/Registration Document</p>
              {verification.business_license_document.toLowerCase().endsWith('.pdf') ? (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                    <div>
                      <p className="font-medium">{verification.business_license_document}</p>
                      <p className="text-sm text-gray-600">PDF Document</p>
                    </div>
                  </div>
                  <a
                    href={`http://localhost:5000/uploads/business_verification/${verification.business_license_document}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    📄 Open PDF Document
                  </a>
                </div>
              ) : (
                <img
                  src={`http://localhost:5000/uploads/business_verification/${verification.business_license_document}`}
                  alt="Business License Document"
                  className="w-full max-w-2xl h-auto rounded-lg border border-gray-300 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(`http://localhost:5000/uploads/business_verification/${verification.business_license_document}`, '_blank')}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual Verification Card Component
function IndividualVerificationCard({
  verification,
  onApprove,
  onReject
}: {
  verification: any;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [showImages, setShowImages] = useState(false);

  return (
    <div className="card-elevated">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            {verification.full_name || 'Unknown User'}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{verification.email}</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              👤 Individual Verification
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              verification.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              verification.status === 'approved' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {verification.status}
            </span>
            <span className="text-xs text-gray-500">
              {formatDateTime(verification.created_at)}
            </span>
          </div>
        </div>

        {verification.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              ✅ Approve
            </button>
            <button
              onClick={onReject}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              ❌ Reject
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Full Name (on ID)</p>
          <p className="font-medium">{verification.full_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">ID Document Type</p>
          <p className="font-medium capitalize">{verification.id_document_type?.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">ID Document Number</p>
          <p className="font-medium">{verification.id_document_number}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">User ID</p>
          <p className="font-medium">#{verification.user_id}</p>
        </div>
      </div>

      {/* Images */}
      <div>
        <button
          onClick={() => setShowImages(!showImages)}
          className="text-sm font-semibold text-primary hover:text-primary-hover mb-3"
        >
          {showImages ? '▼ Hide Documents' : '▶ View Submitted Documents'}
        </button>

        {showImages && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {/* ID Front */}
            {verification.id_document_front && (
              <div>
                <p className="text-sm font-semibold mb-2">ID Front</p>
                <img
                  src={`http://localhost:5000/uploads/individual_verification/${verification.id_document_front}`}
                  alt="ID Document Front"
                  className="w-full h-auto rounded-lg border border-gray-300 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(`http://localhost:5000/uploads/individual_verification/${verification.id_document_front}`, '_blank')}
                />
              </div>
            )}

            {/* ID Back */}
            {verification.id_document_back && (
              <div>
                <p className="text-sm font-semibold mb-2">ID Back</p>
                <img
                  src={`http://localhost:5000/uploads/individual_verification/${verification.id_document_back}`}
                  alt="ID Document Back"
                  className="w-full h-auto rounded-lg border border-gray-300 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(`http://localhost:5000/uploads/individual_verification/${verification.id_document_back}`, '_blank')}
                />
              </div>
            )}

            {/* Selfie with ID */}
            {verification.selfie_with_id && (
              <div>
                <p className="text-sm font-semibold mb-2">Selfie with ID</p>
                <img
                  src={`http://localhost:5000/uploads/individual_verification/${verification.selfie_with_id}`}
                  alt="Selfie with ID"
                  className="w-full h-auto rounded-lg border border-gray-300 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(`http://localhost:5000/uploads/individual_verification/${verification.selfie_with_id}`, '_blank')}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Verification Card Component
function VerificationCard({
  verification,
  onApprove,
  onReject
}: {
  verification: VerificationRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="card-elevated">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg mb-1">
            {verification.user?.fullName || 'Unknown User'}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{verification.user?.email}</p>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {verification.type === 'business' ? '🏢 Business' : '👤 Individual'}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              verification.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              verification.status === 'approved' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {verification.status}
            </span>
            <span className="text-xs text-gray-500">
              {formatDateTime(verification.created_at)}
            </span>
          </div>
        </div>

        {verification.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              ✅ Approve
            </button>
            <button
              onClick={onReject}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              ❌ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Activity Logs Content Component
function ActivityLogsContent() {
  return (
    <div className="card-elevated text-center py-12 text-gray-500">
      <p className="text-4xl mb-4">📋</p>
      <p>Activity logs will be displayed here</p>
      <p className="text-sm text-muted">View all editor activities and actions</p>
    </div>
  );
}

// Users Content Component
function UsersContent() {
  return (
    <div className="card-elevated text-center py-12 text-gray-500">
      <p className="text-4xl mb-4">👥</p>
      <p>Users list</p>
      <p className="text-sm text-muted">View and search user accounts</p>
    </div>
  );
}

// Reusable Components
function StatCard({ icon, title, value, color }: { icon: string; title: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card-elevated">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ icon, title, count, color }: { icon: string; title: string; count: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colorClasses[color as keyof typeof colorClasses]}`}>
        {count}
      </span>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
