'use client';

import React from 'react';
import type { Category } from '../types';

interface CategoriesTableProps {
  parentCategories: Category[];
  getSubcategories: (parentId: number) => Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export default function CategoriesTable({
  parentCategories,
  getSubcategories,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Slug</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Parent</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ads</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Subcategories</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {parentCategories.map((category) => (
              <React.Fragment key={category.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {category.icon && <span className="text-xl">{category.icon}</span>}
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{category.slug}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">-</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{category.ad_count}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{category.subcategory_count}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onEdit(category)}
                      className="text-indigo-600 hover:text-indigo-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(category)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {getSubcategories(category.id).map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 bg-gray-25">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 ml-8">
                        {sub.icon && <span className="text-lg">{sub.icon}</span>}
                        <span className="text-gray-700">└ {sub.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{sub.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{category.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sub.ad_count}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sub.subcategory_count}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onEdit(sub)}
                        className="text-indigo-600 hover:text-indigo-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(sub)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
