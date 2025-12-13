'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { useCategories } from './useCategories';
import { CategoriesTable, CategoryModal } from './components';

export default function CategoriesManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const {
    loading,
    staff,
    error,
    success,
    showModal,
    editingCategory,
    formData,
    parentCategories,
    getSubcategories,
    handleOpenModal,
    handleCloseModal,
    handleNameChange,
    setFormData,
    handleSubmit,
    handleDelete,
    handleLogout,
  } = useCategories(params.lang);

  const navSections = getSuperAdminNavSections(params.lang);

  if (loading && parentCategories.length === 0) {
    return (
      <DashboardLayout
        lang={params.lang}
        userName={staff?.fullName}
        userEmail={staff?.email}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName}
      userEmail={staff?.email}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
            <p className="text-gray-600 mt-1">
              Manage ad categories and subcategories
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Category
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Categories Table */}
        <CategoriesTable
          parentCategories={parentCategories}
          getSubcategories={getSubcategories}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={showModal}
        editingCategory={editingCategory}
        formData={formData}
        parentCategories={parentCategories}
        error={error}
        success={success}
        onClose={handleCloseModal}
        onNameChange={handleNameChange}
        onFormChange={setFormData}
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  );
}
