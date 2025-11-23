'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getUsers, suspendUser, unsuspendUser } from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_suspended: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  account_type: string;
  business_name: string | null;
  business_verification_status: string;
  individual_verified: boolean;
  created_at: string;
  avatar: string | null;
  location_name: string | null;
  suspended_by_name: string | null;
  ad_count: number;
  shop_slug: string | null;
}

export default function UserManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState<number | undefined>(undefined);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUsers(undefined, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
        page,
        limit: 20,
      });

      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    loadUsers();
  }, [authLoading, staff, isEditor, params.lang, router, loadUsers]);

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    try {
      setActionLoading(true);
      const response = await suspendUser(
        selectedUser.id,
        suspendReason,
        suspendDuration
      );

      if (response.success) {
        alert('User suspended successfully!');
        setShowSuspendModal(false);
        setSuspendReason('');
        setSuspendDuration(undefined);
        loadUsers();
        setSelectedUser(null);
      } else {
        alert('Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (user: User) => {
    if (!confirm(`Are you sure you want to unsuspend ${user.full_name}?`)) return;

    try {
      setActionLoading(true);
      const response = await unsuspendUser(user.id);

      if (response.success) {
        alert('User unsuspended successfully!');
        loadUsers();
      } else {
        alert('Failed to unsuspend user');
      }
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Error unsuspending user');
    } finally {
      setActionLoading(false);
    }
  };

  const getUserBadge = (user: User) => {
    if (user.is_suspended) return 'bg-red-100 text-red-800 border-red-200';
    if (user.business_verification_status === 'approved') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (user.individual_verified) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">⏳</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading users...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage and monitor platform users</p>
          </div>
          <button
            onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">Total Users</div>
                <div className="text-3xl font-bold text-blue-900">{users.length}</div>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700 mb-1">Active Users</div>
                <div className="text-3xl font-bold text-green-900">
                  {users.filter(u => !u.is_suspended).length}
                </div>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-700 mb-1">Suspended</div>
                <div className="text-3xl font-bold text-red-900">
                  {users.filter(u => u.is_suspended).length}
                </div>
              </div>
              <div className="text-4xl">🚫</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700 mb-1">Verified</div>
                <div className="text-3xl font-bold text-purple-900">
                  {users.filter(u => u.business_verification_status === 'approved' || u.individual_verified).length}
                </div>
              </div>
              <div className="text-4xl">✓</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-teal-700">
                              {user.full_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getUserBadge(user)}`}>
                          {user.is_suspended ? '🚫 Suspended' :
                           user.business_verification_status === 'approved' ? '🏢 Business' :
                           user.individual_verified ? '✓ Verified' :
                           '👤 Regular'}
                        </span>
                        {user.is_suspended && (
                          <div className="mt-2 max-w-xs">
                            {user.suspended_until && (
                              <div className="text-xs text-red-600 font-medium">
                                Until: {new Date(user.suspended_until).toLocaleDateString()}
                              </div>
                            )}
                            {!user.suspended_until && (
                              <div className="text-xs text-red-600 font-medium">
                                Permanent
                              </div>
                            )}
                            {user.suspension_reason && (
                              <div className="text-xs text-gray-700 mt-1 bg-red-50 p-2 rounded border border-red-200">
                                <span className="font-semibold">Reason:</span> {user.suspension_reason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.ad_count} ads
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {user.is_suspended ? (
                          <button
                            onClick={() => handleUnsuspend(user)}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowSuspendModal(true);
                            }}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (user.shop_slug) {
                              window.open(`/${params.lang}/shop/${user.shop_slug}`, '_blank');
                            } else {
                              alert('User does not have a shop profile');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Shop
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Suspend User
            </h3>
            <p className="text-gray-600 mb-4">
              You are about to suspend: <strong>{selectedUser.full_name}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for suspension *
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter detailed reason..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days, optional)
                </label>
                <input
                  type="number"
                  value={suspendDuration || ''}
                  onChange={(e) => setSuspendDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Leave empty for permanent"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for permanent suspension
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                  setSuspendDuration(undefined);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={actionLoading || !suspendReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
