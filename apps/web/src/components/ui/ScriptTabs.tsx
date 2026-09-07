'use client';

import { useState, type ReactNode } from 'react';

type Script = 'en' | 'roman';

interface Variant {
  top?: ReactNode;
  content: ReactNode;
}

interface ScriptTabsProps {
  /** Off when the page is already in Devanagari: nothing to switch. */
  enabled: boolean;
  englishLabel: string;
  romanLabel: string;
  en: Variant;
  roman: Variant;
  align?: 'left' | 'center';
}

/**
 * English / Nepali (Roman) switch for safety copy. Both variants are
 * rendered on the server; this only decides which one shows.
 */
export default function ScriptTabs({
  enabled,
  englishLabel,
  romanLabel,
  en,
  roman,
  align = 'left',
}: ScriptTabsProps) {
  const [script, setScript] = useState<Script>('en');
  const variant = script === 'roman' ? roman : en;

  if (!enabled) {
    return (
      <>
        {en.top}
        {en.content}
      </>
    );
  }

  const tab = (value: Script, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={script === value}
      onClick={() => setScript(value)}
      className={`min-h-[38px] px-4 rounded-full text-xs font-semibold transition-colors ${
        script === value ? 'bg-orange-600 text-white' : 'text-orange-800 hover:bg-orange-200/60'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {variant.top}
      <div className={`flex ${align === 'center' ? 'justify-center' : ''} my-4`}>
        <div role="tablist" className="inline-flex gap-1 p-1 rounded-full bg-orange-100">
          {tab('en', englishLabel)}
          {tab('roman', romanLabel)}
        </div>
      </div>
      {variant.content}
    </>
  );
}
