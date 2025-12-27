'use client';

import type { EditAdFormData, Category, Subcategory } from './types';

interface CategorySectionProps {
  formData: EditAdFormData;
  categories: Category[];
  subcategories: Subcategory[];
  loadingSubcategories: boolean;
  onCategoryChange: (categoryId: string) => void;
  onFormChange: (updates: Partial<EditAdFormData>) => void;
}

export function CategorySection({
  formData,
  categories,
  subcategories,
  loadingSubcategories,
  onCategoryChange,
  onFormChange,
}: CategorySectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Category *</h2>

      {/* Main Category */}
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Select Category *</label>
        <select
          value={formData.categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          required
          className="w-full p-3 rounded-lg border border-gray-300 text-base"
        >
          <option value="">-- Select Main Category --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.icon || 'package'} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory */}
      {formData.categoryId && (
        <div className="mt-4">
          <label className="block mb-2 font-medium text-gray-700">Select Subcategory *</label>
          <select
            value={formData.subcategoryId}
            onChange={(e) => onFormChange({ subcategoryId: e.target.value })}
            disabled={loadingSubcategories}
            required
            className={`w-full p-3 rounded-lg border border-gray-300 text-base ${
              loadingSubcategories ? 'bg-gray-100 cursor-wait' : 'cursor-pointer'
            }`}
          >
            <option value="">
              {loadingSubcategories ? 'Loading subcategories...' : '-- Select Subcategory --'}
            </option>
            {!loadingSubcategories &&
              subcategories.map((sub) => (
                <option key={sub.id} value={String(sub.id)}>
                  {sub.name}
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
}
