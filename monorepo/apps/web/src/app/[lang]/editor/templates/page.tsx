'use client';

import { use, useState } from 'react';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/editorNavigation';
import { useEditorAuth } from '@/hooks/useEditorAuth';
import {
  EditorLoadingScreen,
  EditorPageHeader,
  EditorStatsCard,
  EditorModal,
  EditorEmptyState,
} from '@/components/editor';
import { getBadgeClasses } from '@/lib/editorHelpers';

interface Template {
  id: number;
  title: string;
  category: string;
  content: string;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

type CategoryType = 'all' | 'ad_rejection' | 'verification_rejection' | 'support' | 'suspension';

export default function ResponseTemplatesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const { staff, authLoading, handleLogout } = useEditorAuth(lang);

  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 1,
      title: 'Inappropriate Content',
      category: 'ad_rejection',
      content: 'Your ad has been rejected because it contains inappropriate content that violates our community guidelines. Please review our policies and resubmit with appropriate content.',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      usageCount: 45,
    },
    {
      id: 2,
      title: 'Duplicate Listing',
      category: 'ad_rejection',
      content: 'This ad appears to be a duplicate of an existing listing. Please remove duplicate posts to maintain quality on our platform.',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      usageCount: 32,
    },
    {
      id: 3,
      title: 'Incomplete Business Documents',
      category: 'verification_rejection',
      content: 'Your business verification has been rejected due to incomplete or unclear documentation. Please provide clear photos of your business license and registration documents.',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      usageCount: 28,
    },
    {
      id: 4,
      title: 'Welcome Support Message',
      category: 'support',
      content: 'Hello! Thank you for contacting ThuLoBazaar support. We\'re here to help you. Please describe your issue in detail and we\'ll get back to you as soon as possible.',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      usageCount: 156,
    },
    {
      id: 5,
      title: 'Spam Activity Warning',
      category: 'suspension',
      content: 'Your account has been temporarily suspended due to spam-like activity. This includes posting multiple similar ads or excessive messaging. Please review our terms of service.',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      usageCount: 12,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'ad_rejection',
    content: '',
  });


  const categories = [
    { value: 'all', label: 'All Templates', icon: '📋' },
    { value: 'ad_rejection', label: 'Ad Rejections', icon: '🚫' },
    { value: 'verification_rejection', label: 'Verification Rejections', icon: '❌' },
    { value: 'support', label: 'Support Responses', icon: '💬' },
    { value: 'suspension', label: 'Account Suspensions', icon: '⚠️' },
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSearch =
      !searchTerm ||
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateTemplate = () => {
    // In a real app, this would make an API call
    const newTemplate: Template = {
      id: templates.length + 1,
      title: formData.title,
      category: formData.category,
      content: formData.content,
      createdBy: staff?.fullName || 'Editor',
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };
    setTemplates([...templates, newTemplate]);
    setShowCreateModal(false);
    setFormData({ title: '', category: 'ad_rejection', content: '' });
    alert('Template created successfully!');
  };

  const handleEditTemplate = () => {
    if (!selectedTemplate) return;
    // In a real app, this would make an API call
    const updatedTemplates = templates.map((t) =>
      t.id === selectedTemplate.id
        ? { ...t, title: formData.title, category: formData.category, content: formData.content }
        : t
    );
    setTemplates(updatedTemplates);
    setShowEditModal(false);
    setSelectedTemplate(null);
    setFormData({ title: '', category: 'ad_rejection', content: '' });
    alert('Template updated successfully!');
  };

  const handleDeleteTemplate = (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    // In a real app, this would make an API call
    setTemplates(templates.filter((t) => t.id !== id));
    alert('Template deleted successfully!');
  };

  const handleCopyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Template copied to clipboard!');
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

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      ad_rejection: 'bg-red-100 text-red-800 border-red-200',
      verification_rejection: 'bg-orange-100 text-orange-800 border-orange-200',
      support: 'bg-blue-100 text-blue-800 border-blue-200',
      suspension: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return badges[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      ad_rejection: 'Ad Rejection',
      verification_rejection: 'Verification Rejection',
      support: 'Support',
      suspension: 'Suspension',
    };
    return labels[category] || category;
  };

  if (authLoading || loading) {
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
                setFormData({ title: '', category: 'ad_rejection', content: '' });
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
          <EditorStatsCard
            label="Total Templates"
            value={templates.length}
            icon="📋"
            color="blue"
          />
          <EditorStatsCard
            label="Total Uses"
            value={templates.reduce((sum, t) => sum + t.usageCount, 0)}
            icon="📊"
            color="green"
          />
          <EditorStatsCard
            label="Most Used"
            value={templates.sort((a, b) => b.usageCount - a.usageCount)[0]?.title || 'N/A'}
            icon="⭐"
            color="purple"
          />
          <EditorStatsCard
            label="Categories"
            value={new Set(templates.map((t) => t.category)).size}
            icon="🏷️"
            color="teal"
          />
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex gap-1 flex-wrap">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setActiveCategory(category.value as CategoryType)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeCategory === category.value
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.icon} {category.label}
            </button>
          ))}
        </div>

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
        {filteredTemplates.length === 0 ? (
          <EditorEmptyState
            title="No templates found"
            description={
              searchTerm
                ? 'Try adjusting your search terms'
                : `No templates in the ${activeCategory === 'all' ? 'system' : getCategoryLabel(activeCategory)} category`
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{template.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeClasses(template.category)}`}>
                      {getCategoryLabel(template.category)}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="font-medium text-teal-600">{template.usageCount} uses</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <p className="text-sm text-gray-700 line-clamp-3">{template.content}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>By: {template.createdBy}</span>
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyTemplate(template.content)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <EditorModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ title: '', category: 'ad_rejection', content: '' });
        }}
        title="Create New Template"
        maxWidth="2xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ title: '', category: 'ad_rejection', content: '' });
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTemplate}
              disabled={!formData.title || !formData.content}
              className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Template
            </button>
          </div>
        }
      >
        <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Inappropriate Content"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="ad_rejection">Ad Rejection</option>
                  <option value="verification_rejection">Verification Rejection</option>
                  <option value="support">Support Response</option>
                  <option value="suspension">Account Suspension</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the template message..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
        </div>
      </EditorModal>

      {/* Edit Template Modal */}
      <EditorModal
        isOpen={showEditModal && !!selectedTemplate}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTemplate(null);
          setFormData({ title: '', category: 'ad_rejection', content: '' });
        }}
        title="Edit Template"
        maxWidth="2xl"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedTemplate(null);
                setFormData({ title: '', category: 'ad_rejection', content: '' });
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditTemplate}
              disabled={!formData.title || !formData.content}
              className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        }
      >
        {selectedTemplate && (
          <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="ad_rejection">Ad Rejection</option>
                  <option value="verification_rejection">Verification Rejection</option>
                  <option value="support">Support Response</option>
                  <option value="suspension">Account Suspension</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
          </div>
        )}
      </EditorModal>
    </DashboardLayout>
  );
}
