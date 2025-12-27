'use client';

import { useState, useEffect } from 'react';

type RecipientType = 'all_users' | 'verified_individual' | 'verified_business';

interface RecipientCounts {
  all_users: number;
  verified_individual: number;
  verified_business: number;
}

interface BroadcastResult {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
}

export function SmsBroadcastSection() {
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('all_users');
  const [counts, setCounts] = useState<RecipientCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch recipient counts on mount
  useEffect(() => {
    async function fetchCounts() {
      try {
        setLoading(true);
        const token = localStorage.getItem('editorToken') || localStorage.getItem('token');
        const response = await fetch('/api/super-admin/sms-broadcast', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setCounts(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch counts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCounts();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    const recipientCount = counts?.[recipientType] || 0;
    if (recipientCount === 0) {
      setError('No recipients in selected group');
      return;
    }

    const confirmMessage = `Are you sure you want to send this SMS to ${recipientCount} recipients?\n\nThis action cannot be undone and will use SMS credits.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSending(true);
      setError(null);
      setResult(null);

      const token = localStorage.getItem('editorToken') || localStorage.getItem('token');
      const response = await fetch('/api/super-admin/sms-broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message.trim(),
          recipientType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setMessage('');
      } else {
        setError(data.message || 'Failed to send broadcast');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const recipientOptions = [
    {
      value: 'all_users' as RecipientType,
      label: 'All Users',
      icon: '👥',
      color: 'blue',
    },
    {
      value: 'verified_individual' as RecipientType,
      label: 'Verified Individual',
      icon: '✓',
      color: 'green',
    },
    {
      value: 'verified_business' as RecipientType,
      label: 'Verified Business',
      icon: '🏢',
      color: 'purple',
    },
  ];

  const selectedCount = counts?.[recipientType] || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Send SMS Broadcast</h2>
        <p className="text-sm text-gray-600">
          Send a custom message to all users or specific groups. Use{' '}
          <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> to personalize with user's name.
        </p>
      </div>

      {/* Recipient Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Select Recipients</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recipientOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRecipientType(option.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                recipientType === option.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{option.icon}</span>
                <span className="font-medium text-gray-900">{option.label}</span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <span className="font-semibold text-gray-700">
                    {counts?.[option.value] || 0} recipients
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Hi {name}, we wish you a Happy New Year! Thank you for being part of Thulo Bazaar."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Use {'{name}'} to include user's name</span>
          <span>{message.length}/500 characters</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-green-800">Broadcast Complete!</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.sentCount}</div>
              <div className="text-green-700">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{result.failedCount}</div>
              <div className="text-red-700">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">{result.skippedCount}</div>
              <div className="text-gray-600">Skipped</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 text-xs text-red-600">
              {result.errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Send Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedCount > 0 ? (
            <span>
              Will send to <strong>{selectedCount}</strong> recipients
            </span>
          ) : (
            <span className="text-amber-600">No recipients with valid phone numbers</span>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !message.trim() || selectedCount === 0}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          {sending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Send Broadcast
            </>
          )}
        </button>
      </div>

      {/* Warning Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Warning:</strong> SMS broadcasts will use your Aakash SMS credits. Make sure your message
          is correct before sending. This action cannot be undone.
        </p>
      </div>
    </div>
  );
}
