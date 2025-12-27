'use client';

import type { EditorDetail } from './types';
import { formatTimestamp } from './types';

interface EditorProfileProps {
  editor: EditorDetail;
  onSuspend: () => void;
  onDelete: () => void;
}

export function EditorProfile({ editor, onSuspend, onDelete }: EditorProfileProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-4 border-indigo-200 shadow-lg">
          {editor.avatar ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/avatars/${editor.avatar}`}
              alt={editor.fullName}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-4xl text-indigo-600 font-bold">{editor.fullName.charAt(0)}</span>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{editor.fullName}</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                editor.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {editor.status === 'active' ? '✓ Active' : '⏸ Suspended'}
            </span>
          </div>
          <p className="text-gray-600 text-lg mb-1">{editor.email}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Joined: {formatTimestamp(editor.createdAt)}</span>
            {editor.lastLogin && (
              <>
                <span>•</span>
                <span>Last login: {formatTimestamp(editor.lastLogin)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onSuspend}
          className={`px-5 py-2.5 border-2 font-semibold rounded-xl transition-all ${
            editor.status === 'active'
              ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {editor.status === 'active' ? '⏸ Suspend' : '▶️ Activate'}
        </button>
        <button
          onClick={onDelete}
          className="px-5 py-2.5 border-2 border-rose-300 text-rose-700 font-semibold rounded-xl hover:bg-rose-50 transition-all"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
