'use client';

import { useState } from 'react';
import { XCircle } from 'lucide-react';

interface RejectAdModalProps {
  adTitle: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export function RejectAdModal({ adTitle, onConfirm, onCancel }: RejectAdModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;

    try {
      setLoading(true);
      await onConfirm(reason);
      setReason('');
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="text-red-500" size={24} />
          <h3 className="text-xl font-bold text-gray-900">Reject Ad</h3>
        </div>

        <p className="text-gray-600 mb-4">
          You are about to reject: <strong>{adTitle}</strong>
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rejection Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this ad is being rejected (user will see this)..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
          rows={4}
        />

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> Be specific so the user knows exactly what to fix before resubmitting.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
