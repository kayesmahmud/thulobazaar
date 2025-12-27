'use client';

import { useRouter } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items = [], className = '' }: BreadcrumbProps) {
  const router = useRouter();

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.path && !item.current) {
      router.push(item.path);
    }
  };

  return (
    <div className={`py-5 px-4 bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          {items.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-400">›</span>}
              {item.current ? (
                <span className="text-gray-900 font-medium">{item.label}</span>
              ) : (
                <span
                  className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer transition-colors duration-200"
                  onClick={() => handleItemClick(item)}
                >
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
