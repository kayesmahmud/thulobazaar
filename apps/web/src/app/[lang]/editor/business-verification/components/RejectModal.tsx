'use client';

import type { BusinessVerification } from './types';

interface RejectModalProps {
  verification: BusinessVerification;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  actionLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RejectModal({
  verification,
  rejectReason,
  setRejectReason,
  actionLoading,
  onClose,
  onConfirm,
}: RejectModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Reject Business Verification
        </h3>
        <p className="text-gray-600 mb-4">
          You are about to reject: <strong>{verification.businessName}</strong>
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter reason for rejection (this will be shown to the user)..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          rows={4}
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading || !rejectReason.trim()}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
