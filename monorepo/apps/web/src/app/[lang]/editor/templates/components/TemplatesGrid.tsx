'use client';

import { EditorEmptyState } from '@/components/editor';
import TemplateCard from './TemplateCard';
import type { Template, CategoryType } from '../types';
import { getCategoryLabel } from '../types';

interface TemplatesGridProps {
  templates: Template[];
  activeCategory: CategoryType;
  searchTerm: string;
  onCopy: (content: string) => void;
  onEdit: (template: Template) => void;
  onDelete: (id: number) => void;
}

export default function TemplatesGrid({
  templates,
  activeCategory,
  searchTerm,
  onCopy,
  onEdit,
  onDelete,
}: TemplatesGridProps) {
  if (templates.length === 0) {
    return (
      <EditorEmptyState
        title="No templates found"
        description={
          searchTerm
            ? 'Try adjusting your search terms'
            : `No templates in the ${activeCategory === 'all' ? 'system' : getCategoryLabel(activeCategory)} category`
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onCopy={onCopy}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
