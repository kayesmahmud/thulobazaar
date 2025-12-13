// @ts-nocheck
'use client';

import { use } from 'react';
import Link from 'next/link';
import { ImageUpload } from '@/components/forms';
import DynamicFormFields from '@/components/post-ad/DynamicFormFields';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import { Button } from '@/components/ui';
import { usePostAd, DraftsList, PhoneVerificationBanner } from './components';

interface PostAdPageProps {
  params: Promise<{ lang: string }>;
}

export default function PostAdPage({ params }: PostAdPageProps) {
  const { lang } = use(params);

  const {
    status,
    formData,
    setFormData,
    images,
    setImages,
    categories,
    subcategories,
    loading,
    loadingSubcategories,
    error,
    submitting,
    userPhone,
    phoneVerified,
    showDrafts,
    drafts,
    isSaving,
    lastSaved,
    getDraftDisplayName,
    formatDraftDate,
    deleteDraft,
    fields,
    customFields,
    customFieldsErrors,
    selectedSubcategory,
    handleLoadDraft,
    handleStartNew,
    handleCategoryChange,
    handleCustomFieldChange,
    handleSubmit,
  } = usePostAd(lang);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-[1000px] mx-auto px-4">
          <div className="flex gap-2 text-sm text-gray-500">
            <Link href={`/${lang}`} className="text-indigo-500 no-underline">
              Home
            </Link>
            <span>/</span>
            <span>Post an Ad</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 m-0">Post a Free Ad</h1>
            {/* Auto-save indicator */}
            {(isSaving || lastSaved) && (
              <span
                className={`text-xs flex items-center gap-1.5 ${isSaving ? 'text-gray-500' : 'text-green-500'}`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full ${isSaving ? 'bg-gray-500 animate-pulse' : 'bg-green-500'}`}
                />
                {isSaving ? 'Saving...' : 'Draft saved'}
              </span>
            )}
          </div>
          <p className="text-gray-500 m-0">Fill in the details below to create your listing</p>
        </div>

        {/* Saved Drafts List */}
        {showDrafts && (
          <DraftsList
            drafts={drafts}
            categories={categories}
            onLoadDraft={handleLoadDraft}
            onDeleteDraft={deleteDraft}
            onStartNew={handleStartNew}
            getDraftDisplayName={getDraftDisplayName}
            formatDraftDate={formatDraftDate}
          />
        )}

        {/* Show form only when not showing drafts or when drafts are dismissed */}
        {(!showDrafts || drafts.length === 0) && (
          <>
            {/* Phone Verification Banner */}
            <PhoneVerificationBanner
              lang={lang}
              phoneVerified={phoneVerified}
              userPhone={userPhone}
              loading={loading}
            />

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-600 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm">
              {/* Ad Details */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Ad Details</h2>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Ad Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., iPhone 15 Pro Max 256GB"
                      required
                      maxLength={100}
                      className="w-full p-3 rounded-lg border border-gray-300 text-base"
                    />
                    <small className="text-gray-500">{formData.title.length}/100</small>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your item in detail..."
                      required
                      rows={6}
                      maxLength={5000}
                      className="w-full p-3 rounded-lg border border-gray-300 text-base resize-y"
                    />
                    <small className="text-gray-500">{formData.description.length}/5000</small>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">Price (NPR) *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="50000"
                        required
                        min="0"
                        step="0.01"
                        className="w-full p-3 rounded-lg border border-gray-300 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isNegotiable}
                        onChange={(e) =>
                          setFormData({ ...formData, isNegotiable: e.target.checked })
                        }
                        className="w-[18px] h-[18px] cursor-pointer"
                      />
                      <span className="font-medium text-gray-700">Price is negotiable</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Category *</h2>

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
                      <option key={cat.id} value={cat.id}>
                        {cat.icon || '📦'} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.categoryId && (
                  <div className="mt-4">
                    <label className="block mb-2 font-medium text-gray-700">
                      Select Subcategory *
                    </label>
                    <select
                      value={formData.subcategoryId}
                      onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                      disabled={loadingSubcategories}
                      required
                      className={`w-full p-3 rounded-lg border border-gray-300 text-base ${
                        loadingSubcategories ? 'bg-gray-100 cursor-wait' : 'cursor-pointer'
                      }`}
                    >
                      <option value="">
                        {loadingSubcategories
                          ? 'Loading subcategories...'
                          : '-- Select Subcategory --'}
                      </option>
                      {!loadingSubcategories &&
                        subcategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
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

              {/* Images */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Photos *</h2>
                <ImageUpload
                  images={images}
                  onChange={setImages}
                  maxImages={10}
                  maxSizeMB={5}
                />
              </div>

              {/* Location */}
              <div className="mb-8">
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="m-0 mb-3 text-base font-semibold text-gray-900">
                    Location (Area/Place) *
                  </h3>
                  <CascadingLocationFilter
                    onLocationSelect={(locationSlug, locationName) => {
                      setFormData((prev) => ({
                        ...prev,
                        locationSlug: locationSlug || '',
                        locationName: locationName || '',
                      }));
                    }}
                    selectedLocationSlug={formData.locationSlug || null}
                    selectedLocationName={formData.locationName || null}
                  />
                  <small className="block mt-3 text-gray-500 text-xs">
                    Select the most specific location for your ad (area/place preferred)
                  </small>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                <Link
                  href={`/${lang}`}
                  className="px-8 py-3 rounded-lg border border-gray-300 bg-white no-underline text-gray-700 font-medium"
                >
                  Cancel
                </Link>
                <Button type="submit" variant="success" loading={submitting} disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post Ad'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
