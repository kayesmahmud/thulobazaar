'use client';

import { useRouter } from 'next/navigation';

interface EditorPageHeaderProps {
  title: string;
  description: string;
  lang: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export function EditorPageHeader({
  title,
  description,
  lang,
  showBackButton = true,
  actions,
}: EditorPageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
      <div className="flex gap-3">
        {actions}
        {showBackButton && (
          <button
            onClick={() => router?.push(`/${lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
