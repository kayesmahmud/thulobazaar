'use client';

import type { VerificationPricing, EditForm } from '../types';
import { DURATION_LABELS } from '../types';

interface PricingTableProps {
  verificationType: string;
  pricings: VerificationPricing[];
  editingId: number | null;
  editForm: EditForm;
  saving: boolean;
  onEdit: (pricing: VerificationPricing) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: number) => void;
  onEditFormChange: (form: EditForm) => void;
}

export default function PricingTable({
  verificationType,
  pricings,
  editingId,
  editForm,
  saving,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onEditFormChange,
}: PricingTableProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {verificationType === 'individual' ? '👤' : '🏢'}
          </span>
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {verificationType === 'individual' ? 'Individual Verification' : 'Business Verification'}
            </h3>
            <p className="text-sm text-gray-600">
              {verificationType === 'individual'
                ? 'Blue badge - Personal identity verification'
                : 'Gold badge - Business/company verification'}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (NPR)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pricings
              .sort((a, b) => a.durationDays - b.durationDays)
              .map((pricing) => {
                const isEditing = editingId === pricing.id;

                return (
                  <tr key={pricing.id} className={!pricing.isActive ? 'opacity-50 bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {DURATION_LABELS[pricing.durationDays] || `${pricing.durationDays} days`}
                      </div>
                      <div className="text-xs text-gray-500">{pricing.durationDays} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => onEditFormChange({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                          className="w-28 px-2 py-1 border border-gray-300 rounded"
                          step="1"
                          min="0"
                        />
                      ) : (
                        <span className="text-lg font-bold">NPR {pricing.price.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isEditing ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) => onEditFormChange({ ...editForm, isActive: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-xs">Active</span>
                        </label>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pricing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pricing.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onSaveEdit(pricing.id)}
                            disabled={saving}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={onCancelEdit}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onEdit(pricing)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
