'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';

interface EditorSearchBarProps {
  /** The committed term the list is currently filtered by. */
  value: string;
  /** Fires with the trimmed input on Search / Enter, and with '' on Clear. Never fires per keystroke. */
  onSearch: (term: string) => void;
  placeholder: string;
  /** Extra filter controls (e.g. a status <select>) rendered before the input. */
  children?: ReactNode;
}

/**
 * Explicit-submit search box for editor list pages.
 * Typing only edits a local draft; the list refetches when the editor presses Search or Enter.
 */
export function EditorSearchBar({ value, onSearch, placeholder, children }: EditorSearchBarProps) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  // Follow the committed term when the parent resets it (e.g. on a tab change).
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(draft.trim());
  };

  const handleClear = () => {
    setDraft('');
    if (value) onSearch('');
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {children}
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full min-h-[44px] pl-4 pr-11 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        {(draft || value) && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="min-h-[44px] px-5 py-2 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <Search size={16} />
        Search
      </button>
    </form>
  );
}
