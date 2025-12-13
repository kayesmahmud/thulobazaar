'use client';

import { use } from 'react';
import Link from 'next/link';
import { ImageUpload } from '@/components/forms';
import DynamicFormFields from '@/components/post-ad/DynamicFormFields';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import { Button } from '@/components/ui';
import { XCircle } from 'lucide-react';
import { useEditAd } from '@/hooks/useEditAd';

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
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 border-l-[6px] border-l-red-600 rounded-xl p-6 mb-8 shadow">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">warning</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-red-900">Your Ad Was Rejected</h3>
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                    Action Required
                  </span>
                </div>
                <p className="text-sm font-semibold text-red-800 mb-2">Reason from editor:</p>
                <p className="text-sm text-red-700 bg-white/70 p-3 rounded-lg border border-red-200 mb-4">
                  {rejectionReason}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-2 items-start">
                    <span className="text-xl flex-shrink-0">info</span>
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-2">What to do next:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Fix the issues mentioned in the rejection reason above</li>
                        <li>Update your ad details in the form below</li>
                        <li>Click "Update Ad" - your ad will automatically be resubmitted for review</li>
                        <li>You'll receive a notification once the editor reviews it again</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approved Lock Message */}
        {isApproved && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400 border-l-[6px] border-l-green-600 rounded-xl p-6 mb-8 shadow">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">lock</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-3">
                  Ad Approved & Published
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  This ad has been approved by our editors and is currently live on ThuluBazaar.
                  For content integrity and fairness to buyers, approved ads cannot be edited.
                </p>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-sm text-yellow-900">
                    <strong>Need to make changes?</strong> You have these options:
                    <br />
                    • Contact our support team if you need to update critical information
                    <br />
                    • Mark this ad as sold and create a new listing with updated details
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow"
        >
          {/* Ad Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Ad Status</h2>
            <select
              value={formData.status}
              onChange={(e) => handleFormChange({ status: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-300 text-base"
            >
              <option value="active">Active (Visible to buyers)</option>
              <option value="sold">Sold (Mark as sold)</option>
              <option value="inactive">Inactive (Hidden from listings)</option>
            </select>
          </div>

          {/* Ad Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Ad Details</h2>

            <div className="flex flex-col gap-4">
              {/* Title */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">Ad Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange({ title: e.target.value })}
                  placeholder="e.g., iPhone 15 Pro Max 256GB"
                  required
                  maxLength={100}
                  className="w-full p-3 rounded-lg border border-gray-300 text-base"
                />
                <small className="text-gray-500">{formData.title.length}/100</small>
              </div>

              {/* Description */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange({ description: e.target.value })}
                  placeholder="Describe your item in detail..."
                  required
                  rows={6}
                  maxLength={5000}
                  className="w-full p-3 rounded-lg border border-gray-300 text-base resize-y"
                />
                <small className="text-gray-500">{formData.description.length}/5000</small>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">Price (NPR) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleFormChange({ price: e.target.value })}
                    placeholder="50000"
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-3 rounded-lg border border-gray-300 text-base"
                  />
                </div>
              </div>

              {/* Negotiable */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNegotiable}
                    onChange={(e) => handleFormChange({ isNegotiable: e.target.checked })}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span className="font-medium text-gray-700">Price is negotiable</span>
                </label>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Category *</h2>

            {/* Main Category */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-700">Select Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 text-base"
              >
                <option value="">-- Select Main Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.icon || 'package'} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            {formData.categoryId && (
              <div className="mt-4">
                <label className="block mb-2 font-medium text-gray-700">Select Subcategory *</label>
                <select
                  value={formData.subcategoryId}
                  onChange={(e) => handleFormChange({ subcategoryId: e.target.value })}
                  disabled={loadingSubcategories}
                  required
                  className={`w-full p-3 rounded-lg border border-gray-300 text-base ${
                    loadingSubcategories ? 'bg-gray-100 cursor-wait' : 'cursor-pointer'
                  }`}
                >
                  <option value="">
                    {loadingSubcategories ? 'Loading subcategories...' : '-- Select Subcategory --'}
                  </option>
                  {!loadingSubcategories &&
                    subcategories.map((sub) => (
                      <option key={sub.id} value={String(sub.id)}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

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

          {/* Location */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="m-0 mb-3 text-base font-semibold text-gray-900">
                Location (Area/Place) *
              </h3>
              <CascadingLocationFilter
                onLocationSelect={(locationSlug, locationName) => {
                  handleFormChange({
                    locationSlug: locationSlug || '',
                    locationName: locationName || '',
                  });
                }}
                selectedLocationSlug={formData.locationSlug || null}
                selectedLocationName={formData.locationName || null}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <Link
              href={`/${lang}/dashboard`}
              className="px-8 py-3 rounded-lg border border-gray-300 bg-white no-underline text-gray-700 font-medium"
            >
              Cancel
            </Link>
            <Button type="submit" variant="success" loading={submitting} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
