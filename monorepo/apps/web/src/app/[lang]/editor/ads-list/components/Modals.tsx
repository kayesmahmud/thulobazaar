'use client';

import type { SuspendModalData, DeleteModalData } from './types';

interface SuspendModalProps {
  data: SuspendModalData;
  actionLoading: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SuspendModal({
  data,
  actionLoading,
  onReasonChange,
  onConfirm,
  onCancel,
}: SuspendModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">⏸️ Suspend Ad</h3>
        <p className="text-gray-600 mb-4">
          You are about to suspend: <strong>{data.ad.title}</strong>
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason for suspension</label>
          <select
            value={data.reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-2"
          >
            <option value="">Select a reason...</option>
            <option value="Spam content">Spam content</option>
            <option value="Inappropriate content">Inappropriate content</option>
            <option value="Violation of terms">Violation of terms</option>
            <option value="Reported by users">Reported by users</option>
            <option value="Suspicious activity">Suspicious activity</option>
            <option value="Other">Other</option>
          </select>
          <textarea
            value={data.reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Or enter custom reason..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading || !data.reason.trim()}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? 'Suspending...' : 'Confirm Suspend'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteModalProps {
  data: DeleteModalData;
  actionLoading: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({
  data,
  actionLoading,
  onReasonChange,
  onConfirm,
  onCancel,
}: DeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-4 border-red-500">
        <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
          ⚠️ PERMANENT DELETE - Cannot Be Undone!
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-semibold mb-2">
            You are about to PERMANENTLY delete:
          </p>
          <p className="text-red-900 font-bold">{data.ad.title}</p>
          <p className="text-red-700 text-sm mt-2">
            This will remove all data including images and cannot be restored!
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason for permanent deletion (optional)</label>
          <textarea
            value={data.reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Enter reason for audit log..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            {actionLoading ? 'Deleting...' : 'DELETE FOREVER'}
          </button>
        </div>
      </div>
    </div>
  );
}
