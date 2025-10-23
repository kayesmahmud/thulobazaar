'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { AdWithDetails, User } from '@thulobazaar/types';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

// Sidebar menu items
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ads', label: 'Ad Management', icon: '📝' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'verifications', label: 'Verifications', icon: '✅' },
  { id: 'promotions', label: 'Promotion Pricing', icon: '💰' },
  { id: 'categories', label: 'Categories', icon: '🏷️' },
  { id: 'locations', label: 'Locations', icon: '📍' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

interface DashboardStats {
  totalAds: number;
  pendingAds: number;
  activeAds: number;
  rejectedAds: number;
  totalUsers: number;
  activeUsers: number;
  totalViews: number;
  todayAds: number;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { logout } = useStaffAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dashboard data
  const [stats, setStats] = useState<DashboardStats>({
    totalAds: 0,
    pendingAds: 0,
    activeAds: 0,
    rejectedAds: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalViews: 0,
    todayAds: 0,
  });

  const [ads, setAds] = useState<AdWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
        await loadDashboardStats();
      } else if (section === 'ads') {
        await loadAds();
      } else if (section === 'users') {
        await loadUsers();
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await apiClient.getAdminStats();
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

  const loadUsers = async () => {
    try {
      const response = await apiClient.getAllUsers({ limit: 100 });
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleApproveAd = async (adId: number) => {
    if (!confirm('Are you sure you want to approve this ad?')) return;

    try {
      const response = await apiClient.approveAd(adId);
      if (response.success) {
        alert('Ad approved successfully!');
        await loadAds();
        await loadDashboardStats();
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
        await loadDashboardStats();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to reject ad');
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    if (!confirm('Are you sure you want to toggle this user\'s status?')) return;

    try {
      const response = await apiClient.toggleUserStatus(userId);
      if (response.success) {
        alert('User status updated successfully!');
        await loadUsers();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update user status');
    }
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardContent stats={stats} onRefresh={loadDashboardStats} />;
      case 'ads':
        return (
          <AdManagementContent
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
      case 'users':
        return (
          <UserManagementContent
            users={users}
            onToggleStatus={handleToggleUserStatus}
          />
        );
      case 'verifications':
        return <VerificationsContent />;
      case 'promotions':
        return <PromotionPricingContent />;
      case 'categories':
        return <CategoriesContent />;
      case 'locations':
        return <LocationsContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <DashboardContent stats={stats} onRefresh={loadDashboardStats} />;
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
            <h1 className="text-xl font-bold text-primary">Super Admin Panel</h1>
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
                  ? 'bg-primary text-white shadow-md'
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
            <span className="text-sm text-gray-600">Super Admin</span>
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              A
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
function DashboardContent({ stats, onRefresh }: { stats: DashboardStats; onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-4 gap-6">
        <StatCard icon="📝" title="Total Ads" value={stats.totalAds} color="blue" />
        <StatCard icon="⏳" title="Pending Ads" value={stats.pendingAds} color="yellow" />
        <StatCard icon="✅" title="Active Ads" value={stats.activeAds} color="green" />
        <StatCard icon="👥" title="Total Users" value={stats.totalUsers} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 laptop:grid-cols-2 gap-6">
        <div className="card-elevated">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Statistics</h3>
            <button onClick={onRefresh} className="btn-outline-primary px-3 py-1 text-sm">
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            <StatItem label="Total Views" value={stats.totalViews.toLocaleString()} />
            <StatItem label="Today's Ads" value={stats.todayAds.toLocaleString()} />
            <StatItem label="Active Users" value={stats.activeUsers.toLocaleString()} />
            <StatItem label="Rejected Ads" value={stats.rejectedAds.toLocaleString()} />
          </div>
        </div>

        <div className="card-elevated">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-outline-primary">Review Ads</button>
            <button className="btn-outline-primary">View Users</button>
            <button className="btn-outline-primary">Manage Pricing</button>
            <button className="btn-outline-primary">View Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ad Management Content Component
interface AdManagementContentProps {
  ads: AdWithDetails[];
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onApprove: (adId: number) => void;
  onReject: (adId: number) => void;
}

function AdManagementContent({ ads, selectedStatus, onStatusChange, onApprove, onReject }: AdManagementContentProps) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card-elevated">
        <div className="flex flex-wrap gap-3">
          {['all', 'pending', 'active', 'rejected', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-primary text-white'
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
            <p>No ads to display</p>
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
            <div className="w-full h-full flex items-center justify-center text-4xl">
              📷
            </div>
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
              <button onClick={onApprove} className="btn-primary px-4 py-2 text-sm">
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

// User Management Content Component
interface UserManagementContentProps {
  users: User[];
  onToggleStatus: (userId: number) => void;
}

function UserManagementContent({ users, onToggleStatus }: UserManagementContentProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="card-elevated">
        <input
          type="text"
          placeholder="Search users by name or email..."
          className="input w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="card-elevated text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">👥</p>
            <p>No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} onToggleStatus={() => onToggleStatus(user.id)} />
          ))
        )}
      </div>
    </div>
  );
}

// User Card Component
function UserCard({ user, onToggleStatus }: { user: User; onToggleStatus: () => void }) {
  return (
    <div className="card-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
            {user.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-semibold">{user.fullName}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {user.role}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onToggleStatus} className="btn-outline-primary px-4 py-2">
          Toggle Status
        </button>
      </div>
    </div>
  );
}

// Other Content Components (keeping simple for now)
function VerificationsContent() {
  return (
    <div className="card-elevated text-center py-12 text-gray-500">
      <p className="text-4xl mb-4">✅</p>
      <p>Verifications management</p>
    </div>
  );
}

function PromotionPricingContent() {
  const promotionTypes = [
    { id: 'featured', name: 'Featured Ad', icon: '🌟', price: 500, duration: '7 days' },
    { id: 'urgent', name: 'Urgent Ad', icon: '🔥', price: 300, duration: '3 days' },
    { id: 'bump_up', name: 'Bump Up', icon: '📈', price: 200, duration: '1 day' },
    { id: 'sticky', name: 'Sticky Ad', icon: '📌', price: 800, duration: '14 days' },
  ];

  return (
    <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6">
      {promotionTypes.map((promo) => (
        <div key={promo.id} className="card-elevated">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{promo.icon}</span>
              <div>
                <h3 className="text-lg font-semibold">{promo.name}</h3>
                <p className="text-sm text-muted">{promo.duration}</p>
              </div>
            </div>
            <button className="btn-outline-primary px-3 py-1 text-sm">Edit</button>
          </div>
          <div className="text-2xl font-bold text-primary">Rs. {promo.price}</div>
        </div>
      ))}
    </div>
  );
}

function CategoriesContent() {
  return (
    <div className="card-elevated text-center py-12 text-gray-500">
      <p className="text-4xl mb-4">🏷️</p>
      <p>Categories management</p>
    </div>
  );
}

function LocationsContent() {
  return (
    <div className="card-elevated text-center py-12 text-gray-500">
      <p className="text-4xl mb-4">📍</p>
      <p>Locations management</p>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="card-elevated">
      <h3 className="text-lg font-semibold mb-4">General Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
          <input type="text" className="input w-full" defaultValue="Thulobazaar" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
          <input type="email" className="input w-full" defaultValue="info@thulobazaar.com" />
        </div>
        <button className="btn-primary">Save Settings</button>
      </div>
    </div>
  );
}

// Reusable Components
function StatCard({ icon, title, value, color }: { icon: string; title: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
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

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
