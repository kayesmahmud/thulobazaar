'use client';

import { use } from 'react';
import Link from 'next/link';
import { ImageUpload } from '@/components/forms';
import DynamicFormFields from '@/components/post-ad/DynamicFormFields';
import { XCircle } from 'lucide-react';
import { useEditAd } from '@/hooks/useEditAd';
import {
  RejectionBanner,
  ApprovedBanner,
  AdDetailsSection,
  CategorySection,
  LocationSection,
  FormActions,
} from './components';

interface EditAdPageProps {
  params: Promise<{ lang: string; id: string }>;
}

export default function EditAdPage({ params }: EditAdPageProps) {
  const { lang, id } = use(params);
  const adId = parseInt(id);

  const {
    formData,
    images,
    existingImages,
    categories,
    subcategories,
    loading,
    loadingSubcategories,
    submitting,
    error,
    adStatus,
    rejectionReason,
    isApproved,
    customFields,
    customFieldsErrors,
    fields,
    status,
    selectedSubcategory,
    setImages,
    handleFormChange,
    handleCategoryChange,
    handleCustomFieldChange,
    handleRemoveExistingImage,
    handleSubmit,
  } = useEditAd(adId, lang);

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">Loading ad...</div>
          <p className="text-gray-500">Loading ad...</p>
        </div>
      </div>
    );
  }

  // Error state (no form data loaded)
  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <XCircle size={48} color="#dc2626" strokeWidth={1.5} />
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href={`/${lang}/dashboard`}
            className="px-6 py-3 bg-indigo-500 text-white rounded-lg no-underline font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-2 text-sm text-gray-500">
            <Link href={`/${lang}`} className="text-indigo-500 no-underline">
              Home
            </Link>
            <span>/</span>
            <Link href={`/${lang}/dashboard`} className="text-indigo-500 no-underline">
              Dashboard
            </Link>
            <span>/</span>
            <span>Edit Ad</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Your Ad</h1>
          <p className="text-gray-500">Update your listing details below</p>
        </div>

        {/* Rejection Notice Banner */}
        {adStatus === 'rejected' && rejectionReason && (
          <RejectionBanner rejectionReason={rejectionReason} />
        )}

        {/* Approved Lock Message */}
        {isApproved && <ApprovedBanner />}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow">
          <AdDetailsSection formData={formData} onFormChange={handleFormChange} />

          <CategorySection
            formData={formData}
            categories={categories}
            subcategories={subcategories}
            loadingSubcategories={loadingSubcategories}
            onCategoryChange={handleCategoryChange}
            onFormChange={handleFormChange}
          />

          {/* Dynamic Category-Specific Fields */}
          {fields.length > 0 && (
            <DynamicFormFields
              fields={fields}
              values={customFields}
              errors={customFieldsErrors}
              onChange={handleCustomFieldChange}
              subcategoryName={selectedSubcategory?.name}
            />
          )}

          {/* Photos Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Photos *</h2>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={10}
              maxSizeMB={5}
              existingImages={existingImages}
              onRemoveExisting={handleRemoveExistingImage}
            />
          </div>

          <LocationSection formData={formData} onFormChange={handleFormChange} />

          <FormActions lang={lang} submitting={submitting} />
        </form>
      </div>
    </div>
  );
}
