// @ts-nocheck
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface UserRow {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  businessVerificationStatus: string | null;
  individualVerified: boolean;
}

export default function UsersListPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'regular' | 'individual' | 'business'>('all');

  const navSections = useMemo(() => getSuperAdminNavSections(lang), [lang]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAllUsers({ limit: 1000, status: statusFilter });
      if (res.success && res.data) {
        setUsers(
          res.data.map((u: any) => ({
            id: u.id,
            fullName: u.full_name || u.fullName || '',
            email: u.email || '',
            phone: u.phone || null,
            businessVerificationStatus: u.business_verification_status || u.businessVerificationStatus || null,
            individualVerified: Boolean(u.individual_verified ?? u.individualVerified),
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isSuperAdmin) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }
    loadUsers();
  }, [authLoading, staff, isSuperAdmin, router, lang, loadUsers]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const getStatusLabel = (user: UserRow) => {
    if (user.businessVerificationStatus && ['approved', 'verified'].includes(user.businessVerificationStatus)) {
      return 'Business Verified';
    }
    if (user.individualVerified) {
      return 'Individual Verified';
    }
    return 'Regular';
  };

  const exportColumn = (field: 'email' | 'phone') => {
    const uniqueValues = Array.from(
      new Set(
        filteredUsers
          .map((u) => (u[field] || '').trim())
          .filter((v) => v)
      )
    );

    const header = field === 'email' ? 'email' : 'phone';
    const csv = [header, ...uniqueValues].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${field}-list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportFullCsv = () => {
    const header = ['user_id', 'name', 'email', 'phone', 'status'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.fullName || '',
      u.email || '',
      u.phone || '',
      getStatusLabel(u),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">⏳</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading users...</div>
            <div className="text-sm text-gray-500 mt-1">Please wait a moment</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={lang}
      userName={staff?.fullName || 'Admin User'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          User List (Read-only)
        </h1>
        <p className="text-gray-600 text-lg">Browse all users and export emails or phone numbers.</p>
      </div>

      <div className="mb-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-2/3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            >
              <option value="all">All users</option>
              <option value="regular">Regular</option>
              <option value="individual">Individual Verified</option>
              <option value="business">Business Verified</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => exportColumn('phone')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              disabled={filteredUsers.length === 0}
            >
              Export Phones (CSV)
            </button>
            <button
              onClick={() => exportColumn('email')}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              disabled={filteredUsers.length === 0}
            >
              Export Emails (CSV)
            </button>
            <button
              onClick={exportFullCsv}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              disabled={filteredUsers.length === 0}
            >
              Export All (CSV)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3 text-left">User ID</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">#{u.id}</td>
                    <td className="px-6 py-3 text-gray-900">{u.fullName || 'N/A'}</td>
                    <td className="px-6 py-3 text-gray-700">{u.email || '—'}</td>
                    <td className="px-6 py-3 text-gray-700">{u.phone || '—'}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                        {getStatusLabel(u)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
