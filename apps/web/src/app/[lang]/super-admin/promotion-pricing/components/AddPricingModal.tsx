'use client';

import { useState } from 'react';
import type { AddFormData, PricingTier } from '../types';
import { DEFAULT_ADD_FORM, pricingTierLabels, pricingTierColors } from '../types';

interface AddPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (form: AddFormData) => Promise<boolean>;
  selectedTier: PricingTier;
}

export default function AddPricingModal({ isOpen, onClose, onAdd, selectedTier }: AddPricingModalProps) {
  const [addForm, setAddForm] = useState<AddFormData>(DEFAULT_ADD_FORM);

  if (!isOpen) return null;

  const handleAdd = async () => {
    const success = await onAdd(addForm);
    if (success) {
      setAddForm(DEFAULT_ADD_FORM);
      onClose();
    }
  };

  const handleClose = () => {
    setAddForm(DEFAULT_ADD_FORM);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-2">Add New Pricing</h2>

        {/* Selected Tier Badge */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Adding to tier:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${pricingTierColors[selectedTier]}`}>
              {pricingTierLabels[selectedTier]}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Promotion Type
            </label>
            <select
              value={addForm.promotion_type}
              onChange={(e) => setAddForm({ ...addForm, promotion_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="featured">Featured</option>
              <option value="urgent">Urgent</option>
              <option value="sticky">Sticky</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days)
            </label>
            <select
              value={addForm.duration_days}
              onChange={(e) => setAddForm({ ...addForm, duration_days: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={15}>15 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              value={addForm.account_type}
              onChange={(e) => setAddForm({ ...addForm, account_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="individual">Individual</option>
              <option value="individual_verified">Individual Verified</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (NPR)
            </label>
            <input
              type="number"
              value={addForm.price}
              onChange={(e) => setAddForm({ ...addForm, price: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              step="0.01"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Percentage
            </label>
            <input
              type="number"
              value={addForm.discount_percentage}
              onChange={(e) => setAddForm({ ...addForm, discount_percentage: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAdd}
            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Add Pricing
          </button>
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
