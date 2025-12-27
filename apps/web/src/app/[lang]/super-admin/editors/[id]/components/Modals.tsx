'use client';

import type { EditorDetail } from './types';

interface SuspendModalProps {
  editor: EditorDetail;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SuspendModal({ editor, onConfirm, onCancel }: SuspendModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {editor.status === 'active' ? 'Suspend Editor?' : 'Activate Editor?'}
        </h3>
        <p className="text-gray-600 mb-6">
          {editor.status === 'active'
            ? `Are you sure you want to suspend ${editor.fullName}? They will no longer be able to access the editor dashboard.`
            : `Are you sure you want to activate ${editor.fullName}? They will regain access to the editor dashboard.`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 font-semibold rounded-xl text-white ${
              editor.status === 'active'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg'
                : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-lg'
            }`}
          >
            {editor.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteModalProps {
  editorName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ editorName, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-rose-600 mb-4">Delete Editor?</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to permanently delete {editorName}? This action cannot be undone and all their activity history will be preserved for audit purposes.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
