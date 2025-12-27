'use client';

import { useState } from 'react';
import { PauseCircle } from 'lucide-react';

interface SuspendAdModalProps {
  adTitle: string;
  onConfirm: (reason: string, duration?: number) => Promise<void>;
  onCancel: () => void;
}

type DurationType = 'indefinite' | '7' | '30' | 'custom';

export function SuspendAdModal({ adTitle, onConfirm, onCancel }: SuspendAdModalProps) {
  const [reason, setReason] = useState('');
  const [durationType, setDurationType] = useState<DurationType>('indefinite');
  const [customDays, setCustomDays] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;

    try {
      setLoading(true);

      let duration: number | undefined;
      if (durationType === '7') duration = 7;
      else if (durationType === '30') duration = 30;
      else if (durationType === 'custom') duration = parseInt(customDays);

      await onConfirm(reason, duration);

      // Reset form
      setReason('');
      setDurationType('indefinite');
      setCustomDays('');
    } catch (error) {
      console.error('Suspension failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <PauseCircle className="text-orange-500" size={24} />
          <h3 className="text-xl font-bold text-gray-900">Suspend Ad</h3>
        </div>

        <p className="text-gray-600 mb-4">
          You are about to suspend: <strong>{adTitle}</strong>
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Suspension Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this ad being suspended?"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none mb-4"
          rows={3}
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Suspension Duration
        </label>
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="duration"
              value="indefinite"
              checked={durationType === 'indefinite'}
              onChange={(e) => setDurationType(e.target.value as DurationType)}
              className="text-orange-500 focus:ring-orange-500"
            />
            <span>Until manually unsuspended</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="duration"
              value="7"
              checked={durationType === '7'}
              onChange={(e) => setDurationType(e.target.value as DurationType)}
              className="text-orange-500 focus:ring-orange-500"
            />
            <span>7 days</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="duration"
              value="30"
              checked={durationType === '30'}
              onChange={(e) => setDurationType(e.target.value as DurationType)}
              className="text-orange-500 focus:ring-orange-500"
            />
            <span>30 days</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="duration"
              value="custom"
              checked={durationType === 'custom'}
              onChange={(e) => setDurationType(e.target.value as DurationType)}
              className="text-orange-500 focus:ring-orange-500"
            />
            <span>Custom:</span>
            <input
              type="number"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              disabled={durationType !== 'custom'}
              placeholder="Days"
              className="w-20 px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
              min="1"
            />
            <span>days</span>
          </label>
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
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Suspending...' : 'Confirm Suspension'}
          </button>
        </div>
      </div>
    </div>
  );
}
