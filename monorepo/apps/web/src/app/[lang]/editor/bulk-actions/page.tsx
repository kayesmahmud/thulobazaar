'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface BulkItem {
  id: number;
  type: 'ad' | 'user' | 'verification';
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

type ActionMode = 'ads' | 'users' | 'verifications';
type BulkOperation = 'approve' | 'reject' | 'delete' | 'suspend' | 'unsuspend';

export default function BulkActionsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [actionMode, setActionMode] = useState<ActionMode>('ads');
  const [items, setItems] = useState<BulkItem[]>(() => {
    const now = Date.now();
    return [
      {
        id: 1,
        type: 'ad',
        title: 'iPhone 13 Pro Max for Sale',
        subtitle: 'Electronics • NPR 95,000',
        status: 'pending',
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        metadata: { category: 'Electronics', userId: 123 },
      },
      {
        id: 2,
        type: 'ad',
        title: 'Toyota Corolla 2020 Model',
        subtitle: 'Vehicles • NPR 3,200,000',
        status: 'pending',
        createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        metadata: { category: 'Vehicles', userId: 124 },
      },
      {
        id: 3,
        type: 'ad',
        title: 'Apartment for Rent in Kathmandu',
        subtitle: 'Real Estate • NPR 25,000/month',
        status: 'pending',
        createdAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
        metadata: { category: 'Real Estate', userId: 125 },
      },
      {
        id: 4,
        type: 'ad',
        title: 'Samsung Galaxy S23 Ultra',
        subtitle: 'Electronics • NPR 145,000',
        status: 'pending',
        createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
        metadata: { category: 'Electronics', userId: 126 },
      },
      {
        id: 5,
        type: 'ad',
        title: 'MacBook Pro M2 2023',
        subtitle: 'Electronics • NPR 250,000',
        status: 'pending',
        createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        metadata: { category: 'Electronics', userId: 127 },
      },
    ];
  });

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [operationReason, setOperationReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
  }, [authLoading, staff, isEditor, params.lang, router]);

  // Clear selections when switching modes
  useEffect(() => {
    setSelectedItems(new Set());
    const now = Date.now();
    // In a real app, fetch items based on actionMode
    if (actionMode === 'users') {
      setItems([
        {
          id: 1,
          type: 'user',
          title: 'john.doe@example.com',
          subtitle: 'Active • 12 ads posted',
          status: 'active',
          createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
          metadata: { adCount: 12 },
        },
        {
          id: 2,
          type: 'user',
          title: 'jane.smith@example.com',
          subtitle: 'Active • 8 ads posted',
          status: 'active',
          createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
          metadata: { adCount: 8 },
        },
        {
          id: 3,
          type: 'user',
          title: 'spam.user@example.com',
          subtitle: 'Flagged • 45 ads posted',
          status: 'flagged',
          createdAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
          metadata: { adCount: 45 },
        },
      ]);
    } else if (actionMode === 'verifications') {
      setItems([
        {
          id: 1,
          type: 'verification',
          title: 'ABC Electronics Pvt Ltd',
          subtitle: 'Business Verification • Pending',
          status: 'pending',
          createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
          metadata: { businessType: 'Electronics' },
        },
        {
          id: 2,
          type: 'verification',
          title: 'XYZ Trading Company',
          subtitle: 'Business Verification • Pending',
          status: 'pending',
          createdAt: new Date(now - 96 * 60 * 60 * 1000).toISOString(),
          metadata: { businessType: 'Trading' },
        },
      ]);
    } else {
      setItems([
        {
          id: 1,
          type: 'ad',
          title: 'iPhone 13 Pro Max for Sale',
          subtitle: 'Electronics • NPR 95,000',
          status: 'pending',
          createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
          metadata: { category: 'Electronics', userId: 123 },
        },
        {
          id: 2,
          type: 'ad',
          title: 'Toyota Corolla 2020 Model',
          subtitle: 'Vehicles • NPR 3,200,000',
          status: 'pending',
          createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
          metadata: { category: 'Vehicles', userId: 124 },
        },
        {
          id: 3,
          type: 'ad',
          title: 'Apartment for Rent in Kathmandu',
          subtitle: 'Real Estate • NPR 25,000/month',
          status: 'pending',
          createdAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
          metadata: { category: 'Real Estate', userId: 125 },
        },
        {
          id: 4,
          type: 'ad',
          title: 'Samsung Galaxy S23 Ultra',
          subtitle: 'Electronics • NPR 145,000',
          status: 'pending',
          createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
          metadata: { category: 'Electronics', userId: 126 },
        },
        {
          id: 5,
          type: 'ad',
          title: 'MacBook Pro M2 2023',
          subtitle: 'Electronics • NPR 250,000',
          status: 'pending',
          createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
          metadata: { category: 'Electronics', userId: 127 },
        },
      ]);
    }
  }, [actionMode]);

  const filteredItems = items.filter((item) =>
    searchTerm
      ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleBulkOperation = (operation: BulkOperation) => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item');
      return;
    }
    setSelectedOperation(operation);
    setShowConfirmModal(true);
  };

  const confirmBulkOperation = () => {
    if (!selectedOperation) return;

    // Operations that require a reason
    if (['reject', 'delete', 'suspend'].includes(selectedOperation) && !operationReason.trim()) {
      alert('Please provide a reason for this action');
      return;
    }

    const selectedCount = selectedItems.size;
    const operationText = {
      approve: 'approved',
      reject: 'rejected',
      delete: 'deleted',
      suspend: 'suspended',
      unsuspend: 'unsuspended',
    }[selectedOperation];

    // In a real app, this would make API calls
    setItems(items.filter((item) => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
    setShowConfirmModal(false);
    setOperationReason('');
    setSelectedOperation(null);

    alert(`Successfully ${operationText} ${selectedCount} item(s)!`);
  };

  const getAvailableOperations = (): { operation: BulkOperation; label: string; icon: string; color: string }[] => {
    if (actionMode === 'ads') {
      return [
        { operation: 'approve', label: 'Approve Selected', icon: '✅', color: 'bg-green-500 hover:bg-green-600' },
        { operation: 'reject', label: 'Reject Selected', icon: '❌', color: 'bg-red-500 hover:bg-red-600' },
        { operation: 'delete', label: 'Delete Selected', icon: '🗑️', color: 'bg-gray-700 hover:bg-gray-800' },
      ];
    } else if (actionMode === 'users') {
      return [
        { operation: 'suspend', label: 'Suspend Selected', icon: '🚫', color: 'bg-orange-500 hover:bg-orange-600' },
        { operation: 'unsuspend', label: 'Unsuspend Selected', icon: '🔓', color: 'bg-blue-500 hover:bg-blue-600' },
      ];
    } else {
      return [
        { operation: 'approve', label: 'Approve Selected', icon: '✅', color: 'bg-green-500 hover:bg-green-600' },
        { operation: 'reject', label: 'Reject Selected', icon: '❌', color: 'bg-red-500 hover:bg-red-600' },
      ];
    }
  };

  const getOperationDescription = () => {
    if (!selectedOperation) return '';
    const count = selectedItems.size;
    const descriptions = {
      approve: `Approve ${count} ${actionMode}`,
      reject: `Reject ${count} ${actionMode} with reason`,
      delete: `Permanently delete ${count} ${actionMode}`,
      suspend: `Suspend ${count} users`,
      unsuspend: `Remove suspension from ${count} users`,
    };
    return descriptions[selectedOperation];
  };

  const needsReason = selectedOperation && ['reject', 'delete', 'suspend'].includes(selectedOperation);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">⏳</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Actions</h1>
            <p className="text-gray-600 mt-1">Perform mass operations on multiple items</p>
          </div>
          <button
            onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex gap-1">
          <button
            onClick={() => setActionMode('ads')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              actionMode === 'ads'
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📢 Ads
          </button>
          <button
            onClick={() => setActionMode('users')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              actionMode === 'users'
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActionMode('verifications')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              actionMode === 'verifications'
                ? 'bg-teal-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🪪 Verifications
          </button>
        </div>

        {/* Stats & Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-500">Total Items</div>
                <div className="text-2xl font-bold text-gray-900">{filteredItems.length}</div>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div>
                <div className="text-sm text-gray-500">Selected</div>
                <div className="text-2xl font-bold text-teal-600">{selectedItems.size}</div>
              </div>
            </div>
            <div className="flex gap-2">
              {getAvailableOperations().map((op) => (
                <button
                  key={op.operation}
                  onClick={() => handleBulkOperation(op.operation)}
                  disabled={selectedItems.size === 0}
                  className={`px-4 py-2 ${op.color} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {op.icon} {op.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search & Select All */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              onClick={toggleSelectAll}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {selectedItems.size === filteredItems.length ? '☑️ Deselect All' : '☐ Select All'}
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900">
              {actionMode.charAt(0).toUpperCase() + actionMode.slice(1)} List
            </h3>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : `No pending ${actionMode} at the moment`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedItems.has(item.id) ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                  }`}
                  onClick={() => toggleSelectItem(item.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                    </div>

                    {/* Item Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">
                        {item.type === 'ad' ? '📢' : item.type === 'user' ? '👤' : '🪪'}
                      </span>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : item.status === 'flagged'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{item.subtitle}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: #{item.id} • Created {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`View details for ${item.title}`);
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <span>💡</span> How to Use Bulk Actions
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>1. Select the type of items you want to work with (Ads, Users, or Verifications)</p>
            <p>2. Use the search box to filter items if needed</p>
            <p>3. Check the boxes next to items you want to include, or use &quot;Select All&quot;</p>
            <p>4. Click the appropriate action button (Approve, Reject, Delete, etc.)</p>
            <p>5. Confirm your action and provide a reason if required</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirm Bulk Action</h3>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">{getOperationDescription()}</div>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> This action will affect {selectedItems.size} item(s) and cannot be undone.
              </div>
            </div>

            {needsReason && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for {selectedOperation} *
                </label>
                <textarea
                  value={operationReason}
                  onChange={(e) => setOperationReason(e.target.value)}
                  placeholder="Enter a detailed reason for this action..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setOperationReason('');
                  setSelectedOperation(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkOperation}
                disabled={Boolean(needsReason) && !operationReason.trim()}
                className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
