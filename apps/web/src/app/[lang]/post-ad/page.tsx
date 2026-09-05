'use client';

import { use, useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ImageUpload } from '@/components/forms';
import DynamicFormFields from '@/components/post-ad/DynamicFormFields';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import { Button } from '@/components/ui';
import {
  usePostAd,
  DraftsList,
  PhoneVerificationBanner,
  AdPostedModal,
  TilePickerField,
  AiConfirmModal,
} from './components';

interface PostAdPageProps {
  params: Promise<{ lang: string }>;
}

export default function PostAdPage({ params }: PostAdPageProps) {
  const { lang } = use(params);
  const t = useTranslations('ads');
  const tc = useTranslations('common');

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
    categoryPolicy,
    aiDraftLoading,
    aiFillOutcome,
    aiUnsellableReason,
    aiFilled,
    clearAiMark,
    aiConfirm,
    handleAiConfirmProceed,
    handleAiConfirmReview,
    handleLoadDraft,
    handleStartNew,
    handleCategoryChange,
    handleCustomFieldChange,
    handleSubmit,
    adPosted,
    adPostedLive,
    adPostedHoldCode,
    adPostedSuggestedCategory,
    adPostedResolved,
    handleAdPostedFix,
    draftRestored,
    handleAdPostedClose,
    isUserVerified,
  } = usePostAd(lang);

  // Small ✨ marker for AI-filled fields; disappears when the user edits the
  // field. Per-field copy so each badge nudges the specific action needed.
  const AI_BADGE_KEYS: Record<string, string> = {
    title: 'aiSuggestedTitle',
    category: 'aiSuggestedCategory',
    description: 'aiSuggestedDescription',
  };
  const aiBadge = (field: string) =>
    aiFilled.has(field) ? (
      <span className="ml-2 text-xs font-normal text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
        ✨ {t(AI_BADGE_KEYS[field] ?? 'aiSuggested')}
      </span>
    ) : null;

  // Photos-first reveal: before any photo only the Photos section shows; while
  // the AI is filling, the wait banner holds the space; once the AI is done
  // (filled or failed) — or content already exists (draft restore) — EVERY
  // remaining field appears at once, AI-filled or empty. The gate wraps all
  // non-photo sections so nothing shows out of order.
  // Typed text only — a category alone doesn't count, because the shop-page
  // memory prefill sets one on load and must not reveal an empty form.
  // A restored draft always reveals: it may legitimately have only
  // photos/price/category and still be the seller's in-progress work.
  const detailsRevealed = Boolean(
    draftRestored ||
      formData.title ||
      formData.description ||
      (images.length > 0 && !aiDraftLoading)
  );

  // Price / Negotiable / COD exist only where the category policy allows them,
  // and the price label follows the category (Salary, Fee, Monthly Rent).
  const priceMode = categoryPolicy.price;

  // Image limits fetched from API settings
  const MAX_IMAGES_VERIFIED = 10;
  const [maxImages, setMaxImages] = useState(isUserVerified ? MAX_IMAGES_VERIFIED : 5);
  useEffect(() => {
    const fetchAdLimits = async () => {
      try {
        const session = await getSession();
        const token = session?.user?.backendToken || '';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const r = await fetch(`${apiUrl}/api/ad-limits`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const d = await r.json();
        if (d.success && d.data?.userImageLimit) setMaxImages(d.data.userImageLimit);
      } catch {
        // Silently fall back to defaults
      }
    };
    fetchAdLimits();
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500">{tc('loading')}</p>
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
              {tc('home')}
            </Link>
            <span>/</span>
            <span>{t('postAnAd')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 m-0">{t('postFreeAd')}</h1>
            {/* Auto-save indicator */}
            {(isSaving || lastSaved) && (
              <span
                className={`text-xs flex items-center gap-1.5 ${isSaving ? 'text-gray-500' : 'text-green-500'}`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full ${isSaving ? 'bg-gray-500 animate-pulse' : 'bg-green-500'}`}
                />
                {isSaving ? tc('saving') : tc('draftSaved')}
              </span>
            )}
          </div>
          <p className="text-gray-500 m-0">{t('fillDetails')}</p>
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
            // @ts-expect-error formatDraftDate type mismatch (string vs string|number)
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
              {/* Photos first — matches how sellers think ("let me show the thing")
                  and the flow of top marketplaces (Vinted, Marketplace, OfferUp) */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 m-0">{t('photos')} *</h2>
                  <span className="text-sm text-gray-500">
                    {t('maxImages', { count: maxImages })}
                  </span>
                </div>

                {/* Upgrade prompt for unverified users */}
                {!isUserVerified && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">✨</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-indigo-900 m-0">
                          {t('wantMoreImages', { count: MAX_IMAGES_VERIFIED })}
                        </p>
                        <p className="text-xs text-indigo-700 mt-1 mb-2">
                          {t('getVerifiedForImages')}
                        </p>
                        <Link
                          href={`/${lang}/verification`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md no-underline transition-colors"
                        >
                          {t('getVerified')}
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <ImageUpload
                  images={images}
                  onChange={setImages}
                  maxImages={maxImages}
                  maxSizeMB={5}
                />

                {aiDraftLoading && (
                  <div className="relative mt-4 p-4 pb-5 bg-violet-50 border border-violet-200 rounded-xl flex items-center gap-3 overflow-hidden">
                    <span className="text-2xl tb-ai-sparkle" aria-hidden>
                      ✨
                    </span>
                    <div>
                      <p className="m-0 font-medium text-violet-900">{t('aiFillingWait')}</p>
                      <p className="m-0 mt-0.5 text-sm text-violet-700">{t('aiFillingWaitHint')}</p>
                    </div>
                    <span className="tb-ai-shimmer" aria-hidden />
                    <style>{`
                      .tb-ai-sparkle {
                        display: inline-block;
                        transform-origin: 50% 60%;
                        animation: tbSparkle 1.6s ease-in-out infinite;
                      }
                      @keyframes tbSparkle {
                        0%, 100% { transform: rotate(-8deg) scale(1); opacity: 0.7; }
                        50% { transform: rotate(10deg) scale(1.25); opacity: 1; }
                      }
                      .tb-ai-shimmer {
                        position: absolute;
                        left: 0; right: 0; bottom: 0;
                        height: 3px;
                        background: #ddd6fe;
                      }
                      .tb-ai-shimmer::after {
                        content: '';
                        position: absolute;
                        top: 0; bottom: 0;
                        width: 35%;
                        border-radius: 9999px;
                        background: linear-gradient(90deg, transparent, #7c3aed, transparent);
                        animation: tbShimmer 1.4s ease-in-out infinite;
                      }
                      @keyframes tbShimmer {
                        0% { left: -35%; }
                        100% { left: 100%; }
                      }
                    `}</style>
                  </div>
                )}

                {aiFillOutcome === 'explicit' && (
                  <p className="mt-3 mb-0 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg p-3">
                    {t('aiExplicitBlocked')}
                  </p>
                )}

                {(aiFillOutcome === 'none' || aiFillOutcome === 'limited') &&
                  !formData.title &&
                  !formData.description && (
                    <p className="mt-3 mb-0 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      {aiFillOutcome === 'limited'
                        ? t('aiLimitReached')
                        : aiUnsellableReason === 'selfie'
                          ? t('aiCouldNotFillSelfie')
                          : aiUnsellableReason === 'screenshot'
                            ? t('aiCouldNotFillScreenshot')
                            : aiUnsellableReason === 'unclear'
                              ? t('aiCouldNotFillUnclear')
                              : aiUnsellableReason === 'prohibited'
                                ? t('aiCouldNotFillProhibited')
                                : t('aiCouldNotFill')}
                    </p>
                  )}
              </div>

              {detailsRevealed && (
                <>
              {/* Ad Title + suggestion */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">{t('adDetails')}</h2>

                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    {t('adTitle')} *{aiBadge('title')}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      clearAiMark('title');
                      setFormData({ ...formData, title: e.target.value });
                    }}
                    placeholder="e.g., iPhone 15 Pro Max 256GB"
                    required
                    maxLength={100}
                    className="w-full p-3 rounded-lg border border-gray-300 text-base"
                  />
                  <small className="text-gray-500">{formData.title.length}/100</small>
                </div>
              </div>

              {/* Category Selection — right after the title so the suggestion lands next to it */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  {t('category')} *{aiBadge('category')}
                </h2>

                <TilePickerField
                  items={categories}
                  selectedId={formData.categoryId}
                  onSelect={handleCategoryChange}
                  placeholder={t('selectCategory')}
                />

                {formData.categoryId && subcategories.length > 0 && (
                  <div className="mt-4">
                    <label className="block mb-2 font-medium text-gray-700">
                      {t('selectSubcategory')} *
                    </label>
                    <TilePickerField
                      items={subcategories}
                      selectedId={formData.subcategoryId}
                      onSelect={(subcategoryId) => {
                        clearAiMark('category');
                        setFormData({ ...formData, subcategoryId });
                      }}
                      placeholder={t('selectSubcategory')}
                      iconSize={34}
                    />
                  </div>
                )}
              </div>

              {/* Category-specific fields sit directly under the subcategory that
                  generates them, so the category choice reads as one step — and so
                  web matches the mobile app's order. */}
              {fields.length > 0 && (
                <DynamicFormFields
                  fields={fields}
                  values={customFields}
                  errors={customFieldsErrors}
                  onChange={handleCustomFieldChange}
                  subcategoryName={selectedSubcategory?.name}
                />
              )}

              {/* Description, Price, Negotiable, Cash on delivery */}
              <div className="mb-8">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      {t('description')} *{aiBadge('description')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => {
                        clearAiMark('description');
                        setFormData({ ...formData, description: e.target.value });
                      }}
                      placeholder={t('describeItem')}
                      required
                      rows={6}
                      maxLength={5000}
                      className="w-full p-3 rounded-lg border border-gray-300 text-base resize-y"
                    />
                    <small className="text-gray-500">{formData.description.length}/5000</small>
                  </div>

                  {!priceMode.hidden && (
                    <div>
                      <label className="block mb-2 font-medium text-gray-700">
                        {lang === 'ne' ? priceMode.labelNe : priceMode.label}
                        {priceMode.required ? ' *' : ''}
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => {
                          clearAiMark('price');
                          setFormData({ ...formData, price: Math.floor(Number(e.target.value)).toString() });
                        }}
                        placeholder="50000"
                        required={priceMode.required}
                        min="0"
                        step="1"
                        className="w-full p-3 rounded-lg border border-gray-300 text-base"
                      />
                    </div>
                  )}

                  {categoryPolicy.negotiable && (
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
                        <span className="font-medium text-gray-700">{t('priceIsNegotiable')}</span>
                      </label>
                    </div>
                  )}

                  {categoryPolicy.cod && (
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isCodAvailable}
                          onChange={(e) =>
                            setFormData({ ...formData, isCodAvailable: e.target.checked })
                          }
                          className="w-[18px] h-[18px] cursor-pointer"
                        />
                        <span className="font-medium text-gray-700">
                          {t('cashOnDeliveryAvailable')}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="mb-8">
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="m-0 mb-3 text-base font-semibold text-gray-900">
                    {t('locationAreaPlace')} *
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
                    minSelectableType="municipality"
                  />
                  <small className="block mt-3 text-gray-500 text-xs">
                    {t('selectLocation')}
                  </small>
                </div>
              </div>

              {/* Contact Information — mirrors the mobile app's final step:
                  the verified phone shown read-only, then WhatsApp which
                  defaults to that same number. */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  {t('contactInformation')}
                </h2>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
                  <p className="m-0 mb-3 text-sm font-semibold text-gray-900">
                    {t('phoneNumber')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-base text-gray-900 font-medium">
                      {userPhone || <span className="text-gray-500">{t('noPhoneAdded')}</span>}
                    </span>
                    {phoneVerified && (
                      <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                        ✓ {t('verified')}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-semibold text-gray-900 m-0 mb-3">{t('whatsapp')}</h3>

                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={formData.whatsappSameAsPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsappSameAsPhone: e.target.checked,
                        // Mirror the phone when ticked, clear it when unticked so
                        // the seller types a fresh number rather than editing one.
                        whatsappNumber: e.target.checked ? userPhone || '' : '',
                      })
                    }
                    className="w-[18px] h-[18px] cursor-pointer"
                  />
                  <span className="font-medium text-gray-700">{t('sameAsPhoneNumber')}</span>
                </label>

                <input
                  type="tel"
                  value={
                    formData.whatsappSameAsPhone ? userPhone || '' : formData.whatsappNumber
                  }
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  disabled={formData.whatsappSameAsPhone}
                  placeholder={t('enterWhatsappNumber')}
                  className="w-full p-3 rounded-lg border border-gray-300 text-base disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
                {formData.whatsappSameAsPhone && (
                  <small className="block mt-1 text-gray-500 italic">
                    {t('uncheckToEditWhatsapp')}
                  </small>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
                <Link
                  href={`/${lang}`}
                  className="px-8 py-3 rounded-lg border border-gray-300 bg-white no-underline text-gray-700 font-medium"
                >
                  {tc('cancel')}
                </Link>
                <Button type="submit" variant="success" loading={submitting} disabled={submitting}>
                  {submitting ? t('posting') : t('postAd')}
                </Button>
              </div>
                </>
              )}
            </form>
          </>
        )}
      </div>

      {aiConfirm && (
        <AiConfirmModal
          warnings={aiConfirm}
          onProceed={handleAiConfirmProceed}
          onReview={handleAiConfirmReview}
        />
      )}
      {adPosted && (
        <AdPostedModal
          lang={lang}
          live={adPostedLive}
          holdCode={adPostedHoldCode}
          suggestedCategory={adPostedSuggestedCategory}
          resolved={adPostedResolved}
          onFix={handleAdPostedFix}
          onClose={handleAdPostedClose}
        />
      )}
    </div>
  );
}
