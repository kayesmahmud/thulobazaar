import React from 'react';

interface RadioOptionProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

/**
 * Reusable radio option component for filters
 * Used for category and condition selections
 */
export default function RadioOption({ label, checked, onChange }: RadioOptionProps) {
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer p-2 rounded-md transition-colors ${
        checked ? 'bg-primary-light' : 'hover:bg-gray-50'
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="cursor-pointer"
      />
      <span className={`text-sm ${checked ? 'text-primary font-semibold' : 'text-gray-700'}`}>
        {label}
      </span>
    </label>
  );
}
