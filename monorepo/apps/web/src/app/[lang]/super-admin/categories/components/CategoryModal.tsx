'use client';

import type { Category, CategoryFormData } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  editingCategory: Category | null;
  formData: CategoryFormData;
  parentCategories: Category[];
  error: string;
  success: string;
  onClose: () => void;
  onNameChange: (name: string) => void;
  onFormChange: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function CategoryModal({
  isOpen,
  editingCategory,
  formData,
  parentCategories,
  error,
  success,
  onClose,
  onNameChange,
  onFormChange,
  onSubmit,
}: CategoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {editingCategory ? 'Edit Category' : 'Add Category'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => onFormChange({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => onFormChange({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="📱"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select
              value={formData.parent_id}
              onChange={(e) => onFormChange({ ...formData, parent_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">None (Top Level)</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Template</label>
            <input
              type="text"
              value={formData.form_template}
              onChange={(e) => onFormChange({ ...formData, form_template: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="vehicle, property, electronics, etc."
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          {success && (
            <div className="text-green-600 text-sm">{success}</div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {editingCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
