'use client';

import type { AdDraft } from '@/hooks/useAdDraft';
import type { Category } from './types';

interface DraftsListProps {
  drafts: AdDraft[];
  categories: Category[];
  onLoadDraft: (draft: AdDraft) => void;
  onDeleteDraft: (id: string) => void;
  onStartNew: () => void;
  getDraftDisplayName: (draft: AdDraft) => string;
  formatDraftDate: (date: string | number) => string;
}

export function DraftsList({
  drafts,
  categories,
  onLoadDraft,
  onDeleteDraft,
  onStartNew,
  getDraftDisplayName,
  formatDraftDate,
}: DraftsListProps) {
  if (drafts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="m-0 text-base font-semibold text-gray-900">
          Saved Drafts ({drafts.length})
        </h2>
        <button
          onClick={onStartNew}
          className="bg-indigo-500 text-white border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer hover:bg-indigo-600"
        >
          + Start New Ad
        </button>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="m-0 mb-1 font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
                {getDraftDisplayName(draft)}
              </p>
              <p className="m-0 text-xs text-gray-500">
                Last edited: {formatDraftDate(draft.updatedAt)}
                {draft.categoryId && (
                  <span className="ml-2">
                    • {categories.find((c) => c.id.toString() === draft.categoryId)?.name || 'Category selected'}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onLoadDraft(draft)}
                className="bg-gray-100 text-gray-700 border-none px-4 py-2 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-200"
              >
                Continue
              </button>
              <button
                onClick={() => onDeleteDraft(draft.id)}
                className="bg-transparent text-red-600 border border-red-300 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
