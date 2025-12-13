'use client';

import type { Editor } from '../types';
import { formatLastLogin } from '../types';

interface EditorsTableProps {
  editors: Editor[];
  lang: string;
  onEdit: (editor: Editor) => void;
  onView: (editorId: number) => void;
}

export default function EditorsTable({ editors, lang, onEdit, onView }: EditorsTableProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Editor</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Last Login</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Ads Work</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Verifications</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {editors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-lg">No editors found</div>
                </td>
              </tr>
            ) : (
              editors.map((editor) => (
                <tr key={editor.id} className="hover:bg-indigo-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {editor.avatar ? (
                        <img
                          src={`${apiUrl}/uploads/avatars/${editor.avatar}`}
                          alt={editor.fullName}
                          className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-indigo-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {editor.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{editor.fullName}</div>
                        <div className="text-sm text-gray-500">{editor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        editor.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {editor.status === 'active' ? '✓ Active' : '✗ Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{formatLastLogin(editor.lastLogin)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-emerald-600">✓ {editor.stats.adsApproved}</div>
                      <div className="text-xs text-rose-600">✗ {editor.stats.adsRejected}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-emerald-600">
                        ✓ {editor.stats.businessApproved + editor.stats.individualApproved}
                      </div>
                      <div className="text-xs text-rose-600">
                        ✗ {editor.stats.businessRejected + editor.stats.individualRejected}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(editor)}
                        className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onView(editor.id)}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors"
                      >
                        View
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          editor.status === 'active'
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {editor.status === 'active' ? 'Suspend' : 'Activate'}
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
  );
}
