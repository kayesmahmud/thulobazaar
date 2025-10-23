'use client';

import { useRouter } from 'next/navigation';
import { CSSProperties } from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  style?: CSSProperties;
}

export default function Breadcrumb({ items = [], style = {} }: BreadcrumbProps) {
  const router = useRouter();

  const defaultStyle: CSSProperties = {
    padding: '1.25rem',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    ...style
  };

  const containerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const breadcrumbStyle: CSSProperties = {
    fontSize: '0.875rem',
    color: '#64748b'
  };

  const linkStyle: CSSProperties = {
    color: '#3b82f6',
    textDecoration: 'none',
    cursor: 'pointer'
  };

  const separatorStyle: CSSProperties = {
    margin: '0 0.5rem',
    color: '#94a3b8'
  };

  const currentStyle: CSSProperties = {
    color: '#1e293b',
    fontWeight: '500'
  };

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.path && !item.current) {
      router.push(item.path);
    }
  };

  return (
    <div style={defaultStyle}>
      <div style={containerStyle}>
        <nav style={breadcrumbStyle}>
          {items.map((item, index) => (
            <span key={index}>
              {index > 0 && <span style={separatorStyle}>›</span>}
              {item.current ? (
                <span style={currentStyle}>{item.label}</span>
              ) : (
                <span
                  style={linkStyle}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={(e) => {
                    if (!item.current) {
                      e.currentTarget.style.textDecoration = 'underline';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.current) {
                      e.currentTarget.style.textDecoration = 'none';
                    }
                  }}
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
