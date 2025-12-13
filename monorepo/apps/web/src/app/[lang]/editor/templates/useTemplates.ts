'use client';

import { useState, useCallback } from 'react';
import type { Template, TemplateFormData, CategoryType } from './types';
import { INITIAL_TEMPLATES } from './types';

export function useTemplates(staffName: string) {
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);

  const createTemplate = useCallback((formData: TemplateFormData) => {
    const newTemplate: Template = {
      id: templates.length + 1,
      title: formData.title,
      category: formData.category,
      content: formData.content,
      createdBy: staffName || 'Editor',
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };
    setTemplates([...templates, newTemplate]);
    alert('Template created successfully!');
    return true;
  }, [templates, staffName]);

  const updateTemplate = useCallback((id: number, formData: TemplateFormData) => {
    const updatedTemplates = templates.map((t) =>
      t.id === id
        ? { ...t, title: formData.title, category: formData.category, content: formData.content }
        : t
    );
    setTemplates(updatedTemplates);
    alert('Template updated successfully!');
    return true;
  }, [templates]);

  const deleteTemplate = useCallback((id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return false;
    setTemplates(templates.filter((t) => t.id !== id));
    alert('Template deleted successfully!');
    return true;
  }, [templates]);

  const copyTemplate = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    alert('Template copied to clipboard!');
  }, []);

  const filterTemplates = useCallback((activeCategory: CategoryType, searchTerm: string) => {
    return templates.filter((template) => {
      const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
      const matchesSearch =
        !searchTerm ||
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates]);

  const getStats = useCallback(() => {
    const totalUses = templates.reduce((sum, t) => sum + t.usageCount, 0);
    const sortedByUsage = [...templates].sort((a, b) => b.usageCount - a.usageCount);
    const mostUsed = sortedByUsage[0]?.title || 'N/A';
    const categoriesCount = new Set(templates.map((t) => t.category)).size;

    return {
      totalTemplates: templates.length,
      totalUses,
      mostUsed,
      categoriesCount,
    };
  }, [templates]);

  return {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    filterTemplates,
    getStats,
  };
}
