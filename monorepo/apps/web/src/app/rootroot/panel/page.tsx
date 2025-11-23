'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SuperAdmin {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  avatar: string | null;
  last_login: string | null;
  suspended_at: string | null;
  created_by_name: string | null;
  total_actions: number;
  editors_created: number;
}

export default function RootAdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('staff_token');
    const userData = localStorage.getItem('staff_user');

    if (!token || !userData) {
      router.push('/rootroot/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'root') {
      router.push('/rootroot/login');
      return;
    }

    setUser(parsedUser);
    loadSuperAdmins();
  }, [router]);

  const loadSuperAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('staff_token');

      console.log('🔍 Loading super-admins...');
      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/super-admins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success && data.data) {
        console.log('✅ Found', data.data.length, 'super-admins');
        setSuperAdmins(data.data);
      } else {
        console.warn('⚠️ API call succeeded but no data:', data);
      }
    } catch (error) {
      console.error('❌ Error loading super-admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id: number, suspend: boolean) => {
    if (confirm(suspend ? 'Suspend this super-admin?' : 'Reactivate this super-admin?')) {
      try {
        const token = localStorage.getItem('staff_token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/super-admins/${id}/suspend`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ suspend }),
          }
        );

        const data = await response.json();
        if (data.success) {
          loadSuperAdmins();
        } else {
          alert(data.message || 'Failed to update super-admin');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to update super-admin status');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure? This will permanently delete this super-admin and all their data.')) {
      try {
        const token = localStorage.getItem('staff_token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/super-admins/${id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          loadSuperAdmins();
        } else {
          alert(data.message || 'Failed to delete super-admin');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete super-admin');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
    router.push('/rootroot/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Branding */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Root Admin Panel
                  </h1>
                  <p className="text-xs text-gray-500">System Control Center</p>
                </div>
              </div>
            </div>

            {/* Right: User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {user.fullName?.charAt(0) || 'R'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-sm font-semibold text-gray-900">{user.fullName || 'Root Admin'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">{user.fullName || 'Root Admin'}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Super-Admin Management</h2>
              <p className="text-gray-600 mt-1">Control all super-administrators across the platform</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              + Create Super-Admin
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-90">Total Super-Admins</div>
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-4xl font-bold">{superAdmins.length}</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-90">Active</div>
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-4xl font-bold">
                {superAdmins.filter(a => a.is_active).length}
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-90">Suspended</div>
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div className="text-4xl font-bold">
                {superAdmins.filter(a => !a.is_active).length}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-90">Total Actions</div>
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-4xl font-bold">
                {superAdmins.reduce((sum, a) => sum + a.total_actions, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Super-Admins Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">All Super-Administrators</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Super-Admin</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Last Login</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Editors</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {superAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-gray-600 font-medium">No super-admins found</p>
                            <p className="text-sm text-gray-500 mt-1">Create one to get started</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    superAdmins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-purple-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {admin.avatar ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/avatars/${admin.avatar}`}
                                alt={admin.full_name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-purple-200 shadow"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                                {admin.full_name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900">{admin.full_name}</div>
                              <div className="text-sm text-gray-500">{admin.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {admin.is_active ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {admin.last_login
                            ? new Date(admin.last_login).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {admin.total_actions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {admin.editors_created}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSuspend(admin.id, admin.is_active)}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-all font-medium ${
                                admin.is_active
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {admin.is_active ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(admin.id)}
                              className="px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-all font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSuperAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadSuperAdmins();
          }}
        />
      )}
    </div>
  );
}

// Create Modal Component
function CreateSuperAdminModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('staff_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/super-admins`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.message || 'Failed to create super-admin');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
              +
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Super-Admin</h2>
              <p className="text-sm text-gray-500">Add a new super-administrator</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Min. 8 characters"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
