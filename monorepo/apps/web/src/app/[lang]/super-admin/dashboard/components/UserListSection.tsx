'use client';

import type { DashboardUser } from '../types';
import { getStatusLabel, exportColumn } from '../types';

interface UserListSectionProps {
  users: DashboardUser[];
  filteredUsers: DashboardUser[];
  userLoading: boolean;
  userSearch: string;
  onSearchChange: (search: string) => void;
}

export default function UserListSection({
  users,
  filteredUsers,
  userLoading,
  userSearch,
  onSearchChange,
}: UserListSectionProps) {
  return (
    <div id="users" className="mt-10 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User List (Read-only)</h2>
          <p className="text-sm text-gray-500">View all users and export emails/phones</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportColumn(filteredUsers, 'phone')}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            disabled={userLoading || filteredUsers.length === 0}
          >
            Export Phones (CSV)
          </button>
          <button
            onClick={() => exportColumn(filteredUsers, 'email')}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            disabled={userLoading || filteredUsers.length === 0}
          >
            Export Emails (CSV)
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={userSearch}
            onChange={(e) => onSearchChange(e.target.value)}
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
      </div>

      {/* Table */}
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
            {userLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-gray-500">Loading users...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
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
  );
}
