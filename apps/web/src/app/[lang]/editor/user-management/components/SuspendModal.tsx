'use client';

import type { User } from '../types';

interface SuspendModalProps {
  user: User;
  reason: string;
  onReasonChange: (reason: string) => void;
  duration: number | undefined;
  onDurationChange: (duration: number | undefined) => void;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SuspendModal({
  user,
  reason,
  onReasonChange,
  duration,
  onDurationChange,
  loading,
  onClose,
  onConfirm,
}: SuspendModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Suspend User
        </h3>
        <p className="text-gray-600 mb-4">
          You are about to suspend: <strong>{user.full_name}</strong>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for suspension *
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Enter detailed reason..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (days, optional)
            </label>
            <input
              type="number"
              value={duration || ''}
              onChange={(e) => onDurationChange(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Leave empty for permanent"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for permanent suspension
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !reason.trim()}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Suspending...' : 'Confirm Suspension'}
          </button>
        </div>
      </div>
    </div>
  );
}
