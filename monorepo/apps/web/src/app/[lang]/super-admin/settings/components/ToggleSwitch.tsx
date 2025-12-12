'use client';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
      {label && <span className="ml-2 text-sm text-gray-600">{label}</span>}
    </label>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}
