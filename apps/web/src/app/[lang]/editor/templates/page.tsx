'use client';

import { use, useState } from 'react';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/navigation';
import { useEditorAuth } from '@/hooks/useEditorAuth';
import {
  EditorLoadingScreen,
  EditorPageHeader,
  EditorStatsCard,
} from '@/components/editor';
import { CategoryTabs, TemplatesGrid, TemplateFormModal } from './components';
import { useTemplates } from './useTemplates';
import { CATEGORIES, DEFAULT_FORM_DATA, type CategoryType, type Template, type TemplateFormData } from './types';

export default function ResponseTemplatesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const { staff, authLoading, handleLogout } = useEditorAuth(lang);

  const {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    filterTemplates,
    getStats,
  } = useTemplates(staff?.fullName || 'Editor');

  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);

  const filteredTemplates = filterTemplates(activeCategory, searchTerm);
  const stats = getStats();

  const handleCreateTemplate = () => {
    if (createTemplate(formData)) {
      setShowCreateModal(false);
      setFormData(DEFAULT_FORM_DATA);
    }
  };

  const handleEditTemplate = () => {
    if (!selectedTemplate) return;
    if (updateTemplate(selectedTemplate.id, formData)) {
      setShowEditModal(false);
      setSelectedTemplate(null);
      setFormData(DEFAULT_FORM_DATA);
    }
  };

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.title,
      category: template.category,
      content: template.content,
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTemplate(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  if (authLoading) {
    return <EditorLoadingScreen message="Loading templates..." />;
  }

  return (
    <DashboardLayout
      lang={lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={getEditorNavSections(lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <EditorPageHeader
          title="Response Templates"
          description="Create and manage reusable response templates"
          lang={lang}
          actions={
            <button
              onClick={() => {
                setFormData(DEFAULT_FORM_DATA);
                setShowCreateModal(true);
              }}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              + Create Template
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <EditorStatsCard label="Total Templates" value={stats.totalTemplates} icon="📋" color="blue" />
          <EditorStatsCard label="Total Uses" value={stats.totalUses} icon="📊" color="green" />
          <EditorStatsCard label="Most Used" value={stats.mostUsed} icon="⭐" color="purple" />
          <EditorStatsCard label="Categories" value={stats.categoriesCount} icon="🏷️" color="teal" />
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <input
            type="text"
            placeholder="Search templates by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Templates Grid */}
        <TemplatesGrid
          templates={filteredTemplates}
          activeCategory={activeCategory}
          searchTerm={searchTerm}
          onCopy={copyTemplate}
          onEdit={openEditModal}
          onDelete={deleteTemplate}
        />
      </div>

      {/* Create Template Modal */}
      <TemplateFormModal
        isOpen={showCreateModal}
        onClose={closeModals}
        title="Create New Template"
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleCreateTemplate}
        submitLabel="Create Template"
      />

      {/* Edit Template Modal */}
      <TemplateFormModal
        isOpen={showEditModal && !!selectedTemplate}
        onClose={closeModals}
        title="Edit Template"
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleEditTemplate}
        submitLabel="Save Changes"
      />
    </DashboardLayout>
  );
}
