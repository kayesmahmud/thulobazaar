'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';
import { EditSuperAdminModal } from '@/components/admin/EditSuperAdminModal';

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
  two_factor_enabled?: boolean;
}

export default function SuperAdminsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SuperAdmin | null>(null);

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    if (staff && isSuperAdmin) {
      loadSuperAdmins();
    }
  }, [authLoading, staff, isSuperAdmin, params.lang, router]);

  const loadSuperAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSuperAdmins();
      if (response.success && response.data) {
        setSuperAdmins(response.data);
      }
    } catch (error) {
      console.error('Error loading super-admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  };

  const handleEditClick = (admin: SuperAdmin) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    loadSuperAdmins();
  };

  const navSections = getSuperAdminNavSections(params.lang);

  if (loading) {
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
            <p className="text-gray-600">Loading super-admins...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Super Administrators</h1>
            <p className="text-gray-600 mt-1">View all super-admins in the system</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Only Root Admin can create/manage super-admins
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Super-Admins</div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">👑</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{superAdmins.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Active</div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {superAdmins.filter(a => a.is_active).length}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Actions</div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {superAdmins.reduce((sum, a) => sum + a.total_actions, 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Super-Admins Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Super-Admin</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Last Login</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Actions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Editors Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {superAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No super-admins found
                    </td>
                  </tr>
                ) : (
                  superAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {admin.avatar ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/avatars/${admin.avatar}`}
                              alt={admin.full_name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
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
                        {admin.editors_created || 0}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEditClick(admin)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Super Admin Modal */}
      <EditSuperAdminModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAdmin(null);
        }}
        onSuccess={handleEditSuccess}
        superAdmin={selectedAdmin}
      />
    </DashboardLayout>
  );
}
