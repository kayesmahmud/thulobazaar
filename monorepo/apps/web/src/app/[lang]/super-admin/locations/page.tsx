'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';
import { getSession } from 'next-auth/react';

interface Location {
  id: number;
  name: string;
  slug: string | null;
  type: 'province' | 'district' | 'municipality' | 'area';
  parent_id: number | null;
  parent_name: string | null;
  latitude: string | null;
  longitude: string | null;
  created_at: string;
  ad_count: string;
  user_count: string;
  sublocation_count: string;
}

export default function LocationsManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'municipality' as 'province' | 'district' | 'municipality' | 'area',
    parent_id: '',
    latitude: '',
    longitude: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Helper function to get auth token
  const getAuthToken = async () => {
    const session = await getSession();

    if (!session) {
      console.error('No session found');
      return null;
    }

    // Check both locations where token might be stored
    const token = session?.user?.backendToken || (session as any)?.backendToken;

    if (!token) {
      console.error('No backend token in session:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userBackendToken: session?.user?.backendToken,
        sessionBackendToken: (session as any)?.backendToken,
        userRole: session?.user?.role,
        userId: session?.user?.id,
      });
    }

    return token || null;
  };

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setLocations(data.data);
      } else {
        throw new Error(data.error || 'Failed to load locations');
      }
    } catch (error: any) {
      console.error('Error loading locations:', error);
      setError(error.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    if (staff && isSuperAdmin) {
      loadLocations();
    }
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadLocations]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  };

  const navSections = getSuperAdminNavSections(params.lang);

  const handleOpenModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        slug: location.slug || '',
        type: location.type,
        parent_id: location.parent_id?.toString() || '',
        latitude: location.latitude || '',
        longitude: location.longitude || ''
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        slug: '',
        type: 'municipality',
        parent_id: '',
        latitude: '',
        longitude: ''
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLocation(null);
    setFormData({
      name: '',
      slug: '',
      type: 'municipality',
      parent_id: '',
      latitude: '',
      longitude: ''
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = await getAuthToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const data = {
        name: formData.name,
        slug: formData.slug || undefined,
        type: formData.type,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };

      const url = editingLocation
        ? `/api/admin/locations/${editingLocation.id}`
        : `/api/admin/locations`;

      const method = editingLocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${editingLocation ? 'update' : 'create'} location`);
      }

      setSuccess(editingLocation ? 'Location updated successfully' : 'Location created successfully');
      await loadLocations();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
    }
  };

  const handleDelete = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) {
      return;
    }

    try {
      setError('');
      const token = await getAuthToken();

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/admin/locations/${location.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete location');
      }

      setSuccess('Location deleted successfully');
      await loadLocations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete location');
      setTimeout(() => setError(''), 5000);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingLocation ? prev.slug : generateSlug(name)
    }));
  };

  if (loading && locations.length === 0) {
    return (
      <DashboardLayout
        lang={params.lang}
        userName={staff?.fullName}
        userEmail={staff?.email}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading locations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredLocations = filterType === 'all'
    ? locations
    : locations.filter(l => l.type === filterType);

  // When filtering by specific type, show all locations of that type (flat list)
  // When showing all, use hierarchical display (parents + sublocations)
  const parentLocations = filterType === 'all'
    ? filteredLocations.filter(l => !l.parent_id)
    : filteredLocations;

  const getSublocations = (parentId: number) => filterType === 'all'
    ? filteredLocations.filter(l => l.parent_id === parentId)
    : [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'province': return 'bg-purple-100 text-purple-700';
      case 'district': return 'bg-blue-100 text-blue-700';
      case 'municipality': return 'bg-green-100 text-green-700';
      case 'area': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName}
      userEmail={staff?.email}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Locations Management</h1>
            <p className="text-gray-600 mt-1">
              Manage provinces, districts, municipalities, and areas
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Location
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All ({locations.length})
          </button>
          <button
            onClick={() => setFilterType('province')}
            className={`px-4 py-2 rounded-lg ${filterType === 'province' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
          >
            Provinces ({locations.filter(l => l.type === 'province').length})
          </button>
          <button
            onClick={() => setFilterType('district')}
            className={`px-4 py-2 rounded-lg ${filterType === 'district' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
          >
            Districts ({locations.filter(l => l.type === 'district').length})
          </button>
          <button
            onClick={() => setFilterType('municipality')}
            className={`px-4 py-2 rounded-lg ${filterType === 'municipality' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
          >
            Municipalities ({locations.filter(l => l.type === 'municipality').length})
          </button>
          <button
            onClick={() => setFilterType('area')}
            className={`px-4 py-2 rounded-lg ${filterType === 'area' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
          >
            Areas ({locations.filter(l => l.type === 'area').length})
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Locations List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Slug</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Parent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ads</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Users</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sublocations</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parentLocations.map((location) => (
                  <React.Fragment key={location.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{location.name}</div>
                        {location.latitude && location.longitude && (
                          <div className="text-xs text-gray-500 font-mono">
                            {location.latitude}, {location.longitude}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{location.slug || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(location.type)}`}>
                          {location.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">-</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{location.ad_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{location.user_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{location.sublocation_count}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(location)}
                          className="text-indigo-600 hover:text-indigo-800 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(location)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {getSublocations(location.id).map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50 bg-gray-25">
                        <td className="px-6 py-4">
                          <div className="ml-8 text-gray-700">└ {sub.name}</div>
                          {sub.latitude && sub.longitude && (
                            <div className="text-xs text-gray-500 font-mono ml-8">
                              {sub.latitude}, {sub.longitude}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{sub.slug || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(sub.type)}`}>
                            {sub.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{location.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{sub.ad_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{sub.user_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{sub.sublocation_count}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenModal(sub)}
                            className="text-indigo-600 hover:text-indigo-800 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="province">Province</option>
                    <option value="district">District</option>
                    <option value="municipality">Municipality</option>
                    <option value="area">Area</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Location</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">None (Top Level)</option>
                    {locations
                      .filter(l => l.type !== 'area')
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.type})
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="47.0105"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="28.8638"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}
                {success && (
                  <div className="text-green-600 text-sm">{success}</div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingLocation ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
