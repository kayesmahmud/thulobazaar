'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PermanentDeleteAdModalProps {
  adTitle: string;
  onConfirm: (reason?: string) => Promise<void>;
  onCancel: () => void;
}

export function PermanentDeleteAdModal({ adTitle, onConfirm, onCancel }: PermanentDeleteAdModalProps) {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmation !== 'DELETE') return;

    try {
      setLoading(true);
      await onConfirm(reason || undefined);

      // Reset form
      setReason('');
      setConfirmation('');
    } catch (error) {
      console.error('Permanent deletion failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-600" size={24} />
          <h3 className="text-xl font-bold text-red-600">⚠️ PERMANENT DELETE - CANNOT UNDO!</h3>
        </div>

        <p className="text-gray-600 mb-4">
          You are about to <strong className="text-red-600">PERMANENTLY DELETE</strong>:{' '}
          <strong>{adTitle}</strong>
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 font-semibold mb-2">⚠️ This will:</p>
          <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
            <li>Delete all ad data</li>
            <li>Delete all images</li>
            <li>Cannot be restored</li>
          </ul>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason (for audit log)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional reason..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
          rows={2}
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type "DELETE" to confirm *
        </label>
        <input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="Type DELETE"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
        />

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
            disabled={loading || confirmation !== 'DELETE'}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            {loading ? 'Deleting...' : 'DELETE FOREVER'}
          </button>
        </div>
      </div>
    </div>
  );
}
