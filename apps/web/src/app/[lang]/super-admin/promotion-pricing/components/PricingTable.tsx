'use client';

import { useState } from 'react';
import type { PromotionPricing, EditFormData } from '../types';
import { promotionTypeLabels, promotionTypeColors, accountTypeLabels, DEFAULT_EDIT_FORM } from '../types';

interface PricingTableProps {
  promotionType: string;
  pricings: PromotionPricing[];
  onUpdate: (id: number, form: EditFormData) => Promise<boolean>;
  onToggleActive: (pricing: PromotionPricing) => Promise<boolean>;
}

export default function PricingTable({ promotionType, pricings, onUpdate, onToggleActive }: PricingTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>(DEFAULT_EDIT_FORM);

  const handleEdit = (pricing: PromotionPricing) => {
    setEditingId(pricing.id);
    setEditForm({
      price: pricing.price,
      discount_percentage: pricing.discount_percentage,
      is_active: pricing.is_active,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(DEFAULT_EDIT_FORM);
  };

  const handleSaveEdit = async (id: number) => {
    const success = await onUpdate(id, editForm);
    if (success) {
      setEditingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              promotionTypeColors[promotionType] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {promotionTypeLabels[promotionType] || promotionType}
          </span>
          <span className="text-sm text-gray-600">
            {pricings.length} pricing rule{pricings.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price (NPR)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pricings.map((pricing) => (
              <tr key={pricing.id} className={!pricing.is_active ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pricing.duration_days} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {accountTypeLabels[pricing.account_type] || pricing.account_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === pricing.id ? (
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                      step="0.01"
                    />
                  ) : (
                    <span className="font-semibold">NPR {pricing.price.toLocaleString()}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {editingId === pricing.id ? (
                    <input
                      type="number"
                      value={editForm.discount_percentage}
                      onChange={(e) => setEditForm({ ...editForm, discount_percentage: parseInt(e.target.value) })}
                      className="w-16 px-2 py-1 border border-gray-300 rounded"
                      min="0"
                      max="100"
                    />
                  ) : (
                    <span>{pricing.discount_percentage}%</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === pricing.id ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-xs">Active</span>
                    </label>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        pricing.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {pricing.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === pricing.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(pricing.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(pricing)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onToggleActive(pricing)}
                        className={`px-3 py-1 rounded text-white ${
                          pricing.is_active
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {pricing.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
