'use client';

import { getBadgeClasses } from '@/lib/editorApi';
import type { Template } from '../types';
import { getCategoryLabel } from '../types';

interface TemplateCardProps {
  template: Template;
  onCopy: (content: string) => void;
  onEdit: (template: Template) => void;
  onDelete: (id: number) => void;
}

export default function TemplateCard({ template, onCopy, onEdit, onDelete }: TemplateCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{template.title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeClasses(template.category)}`}>
            {getCategoryLabel(template.category)}
          </span>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div className="font-medium text-teal-600">{template.usageCount} uses</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <p className="text-sm text-gray-700 line-clamp-3">{template.content}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>By: {template.createdBy}</span>
        <span>{new Date(template.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onCopy(template.content)}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          📋 Copy
        </button>
        <button
          onClick={() => onEdit(template)}
          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
