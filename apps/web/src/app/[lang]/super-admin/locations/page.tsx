'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { FilterBar, LocationsTable, LocationModal } from './components';
import { useLocations } from './useLocations';
import type { Location, LocationFormData } from './types';
import { DEFAULT_FORM_DATA } from './types';

export default function LocationsManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const {
    locations,
    loading,
    error,
    success,
    loadLocations,
    saveLocation,
    deleteLocation,
    clearMessages,
  } = useLocations();

  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(DEFAULT_FORM_DATA);
  const [filterType, setFilterType] = useState('all');

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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleOpenModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        slug: location.slug || '',
        type: location.type,
        parent_id: location.parent_id?.toString() || '',
        latitude: location.latitude || '',
        longitude: location.longitude || '',
      });
    } else {
      setEditingLocation(null);
      setFormData(DEFAULT_FORM_DATA);
    }
    setShowModal(true);
    clearMessages();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLocation(null);
    setFormData(DEFAULT_FORM_DATA);
    clearMessages();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await saveLocation(formData, editingLocation?.id);
    if (saved) {
      setTimeout(() => handleCloseModal(), 1500);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingLocation ? prev.slug : generateSlug(name),
    }));
  };

  const handleFormChange = (data: Partial<LocationFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const navSections = getSuperAdminNavSections(params.lang);

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
        <FilterBar
          locations={locations}
          filterType={filterType}
          onFilterChange={setFilterType}
        />

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

        {/* Locations Table */}
        <LocationsTable
          locations={locations}
          filterType={filterType}
          onEdit={handleOpenModal}
          onDelete={deleteLocation}
        />

        {/* Location Modal */}
        <LocationModal
          isOpen={showModal}
          editingLocation={editingLocation}
          formData={formData}
          locations={locations}
          error={error}
          success={success}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          onFormChange={handleFormChange}
          onNameChange={handleNameChange}
        />
      </div>
    </DashboardLayout>
  );
}
