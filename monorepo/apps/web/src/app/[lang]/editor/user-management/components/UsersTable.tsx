'use client';

import type { User } from '../types';
import { getUserBadge, getUserStatusLabel } from '../types';

interface UsersTableProps {
  users: User[];
  lang: string;
  actionLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSuspend: (user: User) => void;
  onUnsuspend: (user: User) => void;
}

export default function UsersTable({
  users,
  lang,
  actionLoading,
  page,
  totalPages,
  onPageChange,
  onSuspend,
  onUnsuspend,
}: UsersTableProps) {
  const handleViewShop = (user: User) => {
    if (user.shop_slug) {
      window.open(`/${lang}/shop/${user.shop_slug}`, '_blank');
    } else {
      alert('User does not have a shop profile');
    }
  };

  return (
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
                      {getUserStatusLabel(user)}
                    </span>
                    {user.is_suspended && (
                      <div className="mt-2 max-w-xs">
                        {user.suspended_until ? (
                          <div className="text-xs text-red-600 font-medium">
                            Until: {new Date(user.suspended_until).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-xs text-red-600 font-medium">Permanent</div>
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
                        onClick={() => onUnsuspend(user)}
                        disabled={actionLoading}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        Unsuspend
                      </button>
                    ) : (
                      <button
                        onClick={() => onSuspend(user)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      onClick={() => handleViewShop(user)}
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
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
