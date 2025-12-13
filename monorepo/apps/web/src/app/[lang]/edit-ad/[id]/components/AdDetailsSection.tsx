'use client';

import type { EditAdFormData } from './types';

interface AdDetailsSectionProps {
  formData: EditAdFormData;
  onFormChange: (updates: Partial<EditAdFormData>) => void;
}

export function AdDetailsSection({ formData, onFormChange }: AdDetailsSectionProps) {
  return (
    <>
      {/* Ad Status */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Ad Status</h2>
        <select
          value={formData.status}
          onChange={(e) => onFormChange({ status: e.target.value })}
          className="w-full p-3 rounded-lg border border-gray-300 text-base"
        >
          <option value="active">Active (Visible to buyers)</option>
          <option value="sold">Sold (Mark as sold)</option>
          <option value="inactive">Inactive (Hidden from listings)</option>
        </select>
      </div>

      {/* Ad Details */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Ad Details</h2>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Ad Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onFormChange({ title: e.target.value })}
              placeholder="e.g., iPhone 15 Pro Max 256GB"
              required
              maxLength={100}
              className="w-full p-3 rounded-lg border border-gray-300 text-base"
            />
            <small className="text-gray-500">{formData.title.length}/100</small>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormChange({ description: e.target.value })}
              placeholder="Describe your item in detail..."
              required
              rows={6}
              maxLength={5000}
              className="w-full p-3 rounded-lg border border-gray-300 text-base resize-y"
            />
            <small className="text-gray-500">{formData.description.length}/5000</small>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium text-gray-700">Price (NPR) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => onFormChange({ price: e.target.value })}
                placeholder="50000"
                required
                min="0"
                step="0.01"
                className="w-full p-3 rounded-lg border border-gray-300 text-base"
              />
            </div>
          </div>

          {/* Negotiable */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNegotiable}
                onChange={(e) => onFormChange({ isNegotiable: e.target.checked })}
                className="w-5 h-5 cursor-pointer"
              />
              <span className="font-medium text-gray-700">Price is negotiable</span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
