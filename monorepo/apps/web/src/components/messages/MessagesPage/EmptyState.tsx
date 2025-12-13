'use client';

import type { TabType } from './types';

interface EmptyStateProps {
  activeTab: TabType;
}

export function EmptyState({ activeTab }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="mt-4 text-lg font-medium">
          {activeTab === 'announcements' ? 'Select an announcement' : 'Select a conversation'}
        </p>
        <p className="mt-1 text-sm">
          {activeTab === 'announcements'
            ? 'Choose an announcement from the list to view details'
            : 'Choose a conversation from the list to start messaging'}
        </p>
      </div>
    </div>
  );
}
