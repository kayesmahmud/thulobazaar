'use client';

import { EditorModal } from '@/components/editor';
import type { TemplateFormData } from '../types';

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: TemplateFormData;
  onFormChange: (data: TemplateFormData) => void;
  onSubmit: () => void;
  submitLabel: string;
}

export default function TemplateFormModal({
  isOpen,
  onClose,
  title,
  formData,
  onFormChange,
  onSubmit,
  submitLabel,
}: TemplateFormModalProps) {
  return (
    <EditorModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="2xl"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!formData.title || !formData.content}
            className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
            placeholder="e.g., Inappropriate Content"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => onFormChange({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="ad_rejection">Ad Rejection</option>
            <option value="verification_rejection">Verification Rejection</option>
            <option value="support">Support Response</option>
            <option value="suspension">Account Suspension</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => onFormChange({ ...formData, content: e.target.value })}
            placeholder="Enter the template message..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </div>
      </div>
    </EditorModal>
  );
}
