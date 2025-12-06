'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface Announcement {
  id: number;
  title: string;
  content: string;
  targetAudience: string;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdByName: string;
  stats: {
    totalAudience: number;
    readCount: number;
    readRate: number;
  };
}

interface AnnouncementDetail extends Announcement {
  stats: {
    totalAudience: number;
    readCount: number;
    readRate: number;
    unreadCount: number;
  };
  timeline: Array<{ date: string; count: number }>;
}

const audienceLabels: Record<string, string> = {
  all_users: 'All Users',
  new_users: 'New Users (1-3 months)',
  business_verified: 'Business Verified',
  individual_verified: 'Individual Verified',
};

const audienceColors: Record<string, string> = {
  all_users: 'bg-blue-100 text-blue-800',
  new_users: 'bg-green-100 text-green-800',
  business_verified: 'bg-purple-100 text-purple-800',
  individual_verified: 'bg-orange-100 text-orange-800',
};

export default function AnnouncementsPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    targetAudience: 'all_users',
    expiresAt: '',
  });
  const [creating, setCreating] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  const navSections = useMemo(() => getSuperAdminNavSections(params.lang), [params.lang]);

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch('/api/super-admin/announcements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    loadAnnouncements();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadAnnouncements]);

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      alert('Title and content are required');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch('/api/super-admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          content: '',
          targetAudience: 'all_users',
          expiresAt: '',
        });
        loadAnnouncements();
      } else {
        alert(data.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert('Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetails = async (announcement: Announcement) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch(`/api/super-admin/announcements/${announcement.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSelectedAnnouncement(data.data);
      }
    } catch (error) {
      console.error('Failed to load announcement details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const token = localStorage.getItem('editorToken');

      const response = await fetch(`/api/super-admin/announcements/${announcement.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !announcement.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        loadAnnouncements();
      }
    } catch (error) {
      console.error('Failed to toggle announcement status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('editorToken');

      const response = await fetch(`/api/super-admin/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        loadAnnouncements();
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Stats
  const totalAnnouncements = announcements.length;
  const activeAnnouncements = announcements.filter((a) => a.isActive).length;
  const totalReach = announcements.reduce((sum, a) => sum + a.stats.totalAudience, 0);
  const totalReads = announcements.reduce((sum, a) => sum + a.stats.readCount, 0);

  if (authLoading || loading) {
    return (
      <DashboardLayout
        lang={params.lang}
        userName={staff?.fullName || 'Super Admin'}
        userEmail={staff?.email || 'admin@thulobazaar.com'}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading announcements...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Super Admin'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Broadcast Announcements</h1>
            <p className="text-gray-600 mt-1">Send announcements to all users or specific groups</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <span>+</span> New Announcement
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Announcements</div>
            <div className="text-2xl font-bold text-gray-800">{totalAnnouncements}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">{activeAnnouncements}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Reach</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalReach.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Reads</div>
            <div className="text-2xl font-bold text-purple-600">
              {totalReads.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Announcements Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Announcement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reach / Read Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No announcements yet. Create your first announcement to broadcast to users.
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr
                    key={announcement.id}
                    className={!announcement.isActive ? 'opacity-60' : ''}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{announcement.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {announcement.content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          audienceColors[announcement.targetAudience] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {audienceLabels[announcement.targetAudience] || announcement.targetAudience}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium">{announcement.stats.totalAudience.toLocaleString()}</span>
                        <span className="text-gray-500"> users</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {announcement.stats.readCount.toLocaleString()} read ({announcement.stats.readRate}%)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          announcement.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {announcement.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {announcement.expiresAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {formatDate(announcement.expiresAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{formatDate(announcement.createdAt)}</div>
                      <div className="text-xs">by {announcement.createdByName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(announcement)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleToggleActive(announcement)}
                          className={`px-3 py-1 rounded text-white text-sm ${
                            announcement.isActive
                              ? 'bg-orange-500 hover:bg-orange-600'
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {announcement.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
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

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Create New Announcement</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Announcement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={createForm.content}
                    onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    rows={4}
                    placeholder="Write your announcement message..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={createForm.targetAudience}
                    onChange={(e) => setCreateForm({ ...createForm, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all_users">All Users</option>
                    <option value="new_users">New Users (1-3 months old)</option>
                    <option value="business_verified">Business Verified Accounts</option>
                    <option value="individual_verified">Individual Verified Accounts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.expiresAt}
                    onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Announcement'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {detailLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading details...</p>
                </div>
              ) : selectedAnnouncement ? (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">{selectedAnnouncement.title}</h2>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedAnnouncement(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600">Target Audience</div>
                      <div className="font-medium">
                        {audienceLabels[selectedAnnouncement.targetAudience]}
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {selectedAnnouncement.stats.totalAudience.toLocaleString()} users
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600">Read Rate</div>
                      <div className="text-2xl font-bold text-green-700">
                        {selectedAnnouncement.stats.readRate}%
                      </div>
                      <div className="text-sm text-green-600">
                        {selectedAnnouncement.stats.readCount.toLocaleString()} of{' '}
                        {selectedAnnouncement.stats.totalAudience.toLocaleString()} read
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>{' '}
                      {formatDate(selectedAnnouncement.createdAt)}
                    </div>
                    <div>
                      <span className="text-gray-500">Expires:</span>{' '}
                      {formatDate(selectedAnnouncement.expiresAt)}
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>{' '}
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          selectedAnnouncement.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedAnnouncement.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created by:</span>{' '}
                      {selectedAnnouncement.createdByName}
                    </div>
                  </div>

                  {/* Read Timeline */}
                  {selectedAnnouncement.timeline && selectedAnnouncement.timeline.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Read Activity (Last 7 Days)</h3>
                      <div className="flex items-end gap-1 h-24">
                        {selectedAnnouncement.timeline.map((day, idx) => {
                          const maxCount = Math.max(...selectedAnnouncement.timeline.map((d) => d.count));
                          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center">
                              <div
                                className="w-full bg-teal-500 rounded-t"
                                style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                                title={`${day.count} reads`}
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500">Failed to load details</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
