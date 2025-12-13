'use client';

import type { Verification } from '../types';
import { formatDate } from '../types';

interface VerificationTableProps {
  verifications: Verification[];
  title: string;
  emptyMessage: string;
  showStatus?: boolean;
}

export default function VerificationTable({
  verifications,
  title,
  emptyMessage,
  showStatus = false,
}: VerificationTableProps) {
  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Details</th>
              {showStatus && <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>}
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {verifications.length === 0 ? (
              <tr>
                <td colSpan={showStatus ? 5 : 4} className="px-6 py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              verifications.map((v) => (
                <tr key={`${v.type}-${v.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      v.type === 'business'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {v.type === 'business' ? '👔 Business' : '👤 Individual'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{v.full_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{v.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {v.type === 'business' ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{v.business_name}</div>
                        <div className="text-sm text-gray-500">{v.business_category || 'No category'}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{v.id_document_type || 'ID Document'}</div>
                        {v.shop_slug && (
                          <div className="text-sm text-gray-500">Shop: {v.shop_slug}</div>
                        )}
                      </div>
                    )}
                  </td>
                  {showStatus && (
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {v.status}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(v.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
