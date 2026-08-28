// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getCategoryPolicy } from '@thulobazaar/types';
import { useFormTemplate } from '@/hooks/useFormTemplate';
import { useAdDraft, AdDraft } from '@/hooks/useAdDraft';
import { apiClient } from '@/lib/api';
import { trackPostAd } from '@/lib/analytics';
import { isValidAdLocationTier } from '@/lib/location/tiers';
import type { Category, PostAdFormData } from './types';
import { INITIAL_FORM_DATA } from './types';

export function usePostAd(lang: string) {
  const t = useTranslations('ads');
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<PostAdFormData>(INITIAL_FORM_DATA);
  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adPosted, setAdPosted] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const approvalPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearApprovalPoll = useCallback(() => {
    if (approvalPollRef.current) {
      clearInterval(approvalPollRef.current);
      approvalPollRef.current = null;
    }
  }, []);
  // Instant AI publish: auto-approved ads redirect to their own page instead
  // of the dashboard Pending tab (owner spec). Ref mirrors state so the
  // close handler always reads the freshest value.
  const [adPostedLive, setAdPostedLive] = useState(false);
  const adPostedLiveRef = useRef(false);
  const postedAdSlugRef = useRef<string | null>(null);

  // User state
  const [userHasDefaultLocation, setUserHasDefaultLocation] = useState(false);
  const [userHasDefaultCategory, setUserHasDefaultCategory] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Draft state
  const [showDrafts, setShowDrafts] = useState(true);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const isLoadingUserDefaultsRef = useRef(false);
  const pendingDraftCustomFieldsRef = useRef<Record<string, unknown> | null>(null);
  const dataLoadedRef = useRef(false);

  // AI autofill (Phase 2) — every AI value is a suggestion; fail-open everywhere
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  // 'filled' = draft applied; 'none' = AI ran but couldn't fill (unsellable/off/
  // error); 'limited' = hourly AI quota hit (never blame the photos for that);
  // 'explicit' = prohibited sexual/nude content — HARD BLOCK, photos removed,
  // uploader auto-reported server-side (the one deliberate exception to
  // warnings-never-block, per owner policy)
  const [aiFillOutcome, setAiFillOutcome] = useState<
    'filled' | 'none' | 'limited' | 'explicit' | null
  >(null);
  // Why the AI declined ('selfie' | 'screenshot' | 'unclear' | 'other') — drives
  // the targeted "this looks like a selfie" style messages
  const [aiUnsellableReason, setAiUnsellableReason] = useState<string | null>(null);
  const [aiFilled, setAiFilled] = useState<Set<string>>(new Set());
  const [aiPriceEstimate, setAiPriceEstimate] = useState<number | null>(null);
  const [aiSellable, setAiSellable] = useState<boolean | null>(null);
  // The pre-post confirmation dialog: list of warning keys, or null (hidden)
  const [aiConfirm, setAiConfirm] = useState<string[] | null>(null);
  const aiDraftRequestedRef = useRef(false);
  const aiConfirmedRef = useRef(false);
  const formDataRef = useRef(formData);
  const imagesRef = useRef(images);
  useEffect(() => {
    formDataRef.current = formData;
    imagesRef.current = images;
  });

  // Background (staged) upload — Phase 2.5: each photo uploads the moment it is
  // picked, so Post Ad only sends ids and returns instantly. Entirely silent
  // and fail-open: if any photo isn't staged by submit time, we fall back to
  // the classic full upload. Keyed by File object identity.
  const stagedIdsRef = useRef(new Map<File, string>());
  const stagingInFlightRef = useRef(new Set<File>());
  useEffect(() => {
    for (const file of images) {
      if (stagedIdsRef.current.has(file) || stagingInFlightRef.current.has(file)) continue;
      stagingInFlightRef.current.add(file);
      apiClient
        .stageAdImage(file)
        .then((res) => {
          if (res?.data?.stagedId) stagedIdsRef.current.set(file, res.data.stagedId);
        })
        .catch(() => {})
        .finally(() => stagingInFlightRef.current.delete(file));
    }
    // Removed photos: forget their staged ids (server sweeper cleans the files)
    for (const file of Array.from(stagedIdsRef.current.keys())) {
      if (!images.includes(file)) stagedIdsRef.current.delete(file);
    }
  }, [images]);

  // The approval poll must not outlive the page (leaks + setState-on-unmounted)
  useEffect(() => clearApprovalPoll, [clearApprovalPoll]);

  // Draft management
  const {
    drafts,
    currentDraftId,
    saveDraft,
    loadDraft,
    deleteDraft,
    clearCurrentDraft,
    startNewDraft,
    isSaving,
    lastSaved,
    getDraftDisplayName,
    formatDraftDate,
  } = useAdDraft();

  // Dynamic form fields state
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [customFieldsErrors, setCustomFieldsErrors] = useState<Record<string, string>>({});

  // Get selected category and subcategory objects
  const selectedCategory = categories.find((c) => c.id.toString() === formData.categoryId) || null;
  const selectedSubcategory =
    subcategories.find((c) => c.id.toString() === formData.subcategoryId) || null;

  // Which of Price / Negotiable / COD / Condition this category actually has.
  // Single source of truth, shared with the API (@thulobazaar/types).
  const categoryPolicy = getCategoryPolicy(
    selectedCategory?.slug ?? '',
    selectedSubcategory?.slug
  );

  // Use template hook to get dynamic fields
  const { fields, validateFields, getInitialValues, templateType } = useFormTemplate(
    selectedCategory,
    selectedSubcategory,
    categories
  );

  // Load subcategories
  const loadSubcategories = useCallback(
    (parentId: number) => {
      setLoadingSubcategories(true);
      const parentCategory = categories.find((cat: any) => cat.id === parentId);

      if (parentCategory?.subcategories && Array.isArray(parentCategory.subcategories)) {
        setSubcategories(parentCategory.subcategories);
      } else {
        setSubcategories([]);
      }
      setLoadingSubcategories(false);
    },
    [categories]
  );

  // Load form data (categories, user profile, location)
  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);

      const [categoriesRes] = await Promise.all([
        apiClient.getCategories({ includeSubcategories: true }),
        apiClient.getLocations({ type: 'municipality' }),
      ]);

      // Map other_categories to subcategories (API returns other_categories, frontend expects subcategories)
      let mappedCategories: Category[] = [];
      if (categoriesRes.success && categoriesRes.data) {
        mappedCategories = categoriesRes.data.map((cat: any) => ({
          ...cat,
          subcategories: cat.other_categories || [],
        }));
        setCategories(mappedCategories);
      }

      // Fetch user's profile
      try {
        const profileRes = await fetch('/api/profile', { credentials: 'include' });
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          setUserPhone(profileData.data.phone || null);
          setPhoneVerified(profileData.data.phoneVerified || false);
        }
      } catch (err) {
        // Non-critical error - user profile fetch failed
        console.warn('Failed to fetch user profile:', err);
      }

      // Fetch user's default location
      try {
        const token = (session as any)?.backendToken;
        if (token) {
          const userLocationRes = await fetch('/api/user/location', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userLocationData = await userLocationRes.json();

          const userLocation = userLocationData.data?.location;

          // Never prefill a tier an ad can't legally use — prefilling a province
          // is what put 97 of the 112 province-level ads in production, because
          // the seller simply never touched the field. The endpoint already
          // falls back to the location of their last ad, so this only stays
          // empty for sellers with no usable location anywhere.
          if (userLocationData.success && isValidAdLocationTier(userLocation?.type)) {
            setFormData((prev) => ({
              ...prev,
              locationSlug: userLocation.slug || '',
              locationName: userLocation.name || '',
            }));
            // A derived location isn't their saved default. Reporting "no
            // default" here is what makes the post-submit hook below write this
            // precise location back to their profile.
            setUserHasDefaultLocation(!userLocationData.data?.derived);
          } else {
            setUserHasDefaultLocation(false);
          }
        }
      } catch (err) {
        // Non-critical error - user location fetch failed
        console.warn('Failed to fetch user location:', err);
      }

      // Fetch user's default category and subcategory
      try {
        const token = (session as any)?.backendToken;
        if (token) {
          const userCategoryRes = await fetch('/api/user/category', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userCategoryData = await userCategoryRes.json();

          if (userCategoryData.success && userCategoryData.data?.category) {
            const userCategory = userCategoryData.data.category;
            const userSubcategory = userCategoryData.data.subcategory;

            // Set flag to prevent useEffect from clearing subcategoryId (use ref to avoid re-render)
            isLoadingUserDefaultsRef.current = true;

            // API now returns category (main) and subcategory separately
            setFormData((prev) => ({
              ...prev,
              categoryId: userCategory.id.toString(),
              subcategoryId: userSubcategory ? userSubcategory.id.toString() : '',
            }));
            setUserHasDefaultCategory(true);

            // Load subcategories directly using mapped categories
            const parentCategory = mappedCategories.find(
              (cat: Category) => cat.id === userCategory.id
            );
            if (parentCategory?.subcategories && Array.isArray(parentCategory.subcategories)) {
              setSubcategories(parentCategory.subcategories);
            }
          } else {
            setUserHasDefaultCategory(false);
          }
        }
      } catch (err) {
        // Non-critical error - user category fetch failed
        console.warn('Failed to fetch user category:', err);
      }
    } catch (err: any) {
      console.error('Error loading form data:', err);
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }
    // Only load form data once when authenticated and session is fully populated
    if (status === 'authenticated' && !dataLoadedRef.current && (session as any)?.backendToken) {
      dataLoadedRef.current = true;
      loadFormData();
    }
  }, [status, session, router, lang, loadFormData]);

  // Load subcategories when category changes (but not for user defaults - handled in loadFormData)
  useEffect(() => {
    // Skip if loading user defaults - subcategories are already set in loadFormData
    if (isLoadingUserDefaultsRef.current) {
      isLoadingUserDefaultsRef.current = false;
      return;
    }

    if (formData.categoryId && formData.categoryId !== '') {
      loadSubcategories(parseInt(formData.categoryId));
    } else {
      setSubcategories([]);
    }

    // Don't clear subcategory when loading from draft
    if (!isLoadingDraft) {
      if (formData.subcategoryId) {
        setFormData((prev) => ({ ...prev, subcategoryId: '' }));
      }
      setCustomFields({});
      setCustomFieldsErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.categoryId]);

  // Initialize custom fields when template fields change
  useEffect(() => {
    if (fields.length > 0) {
      if (pendingDraftCustomFieldsRef.current) {
        setCustomFields(pendingDraftCustomFieldsRef.current);
        pendingDraftCustomFieldsRef.current = null;
        setIsLoadingDraft(false);
      } else if (!isLoadingDraft && getInitialValues) {
        const initialValues = getInitialValues();
        setCustomFields(initialValues);
      }
      setCustomFieldsErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length]);

  // Switching category must not leave a value behind that the new category
  // has no input for — it would still be submitted.
  useEffect(() => {
    setFormData((prev) => {
      const isNegotiable = categoryPolicy.negotiable ? prev.isNegotiable : false;
      const isCodAvailable = categoryPolicy.cod ? prev.isCodAvailable : false;
      const price = categoryPolicy.price.hidden ? '' : prev.price;
      if (
        isNegotiable === prev.isNegotiable &&
        isCodAvailable === prev.isCodAvailable &&
        price === prev.price
      ) {
        return prev;
      }
      return { ...prev, isNegotiable, isCodAvailable, price };
    });
    if (categoryPolicy.condition === 'hidden') {
      setCustomFields((prev) => {
        if (!('condition' in prev)) return prev;
        const { condition: _condition, ...rest } = prev;
        return rest;
      });
    }
  }, [categoryPolicy.negotiable, categoryPolicy.cod, categoryPolicy.price.hidden, categoryPolicy.condition]);

  // Auto-save draft
  useEffect(() => {
    if (!formData.title && !formData.description && !formData.price && !formData.categoryId) {
      return;
    }
    saveDraft(formData, customFields);
  }, [formData, customFields, saveDraft]);

  // Apply an AI draft. The photo is authoritative (owner, 2026-08-27): AI
  // values REPLACE anything typed before the photos landed — every replaced
  // field carries the ✨ badge and stays fully editable.
  const applyAiDraft = useCallback(
    (draft: any) => {
      const snapshot = formDataRef.current;
      const updates: Record<string, string> = {};
      const marks = new Set<string>();

      if (draft.title) {
        updates.title = draft.title;
        marks.add('title');
      }
      if (draft.description) {
        updates.description = draft.description;
        marks.add('description');
      }
      // Price is deliberately NOT filled (owner, 2026-08-27): the seller types
      // their own price. The estimate is still stored (aiPriceEstimate) so the
      // absurd-price warning can fire on a wildly off typed price.
      // NOTE: draft.attributes.condition is deliberately NOT applied on web —
      // this form has no condition control, so an AI-set condition could never
      // be reviewed (spec: every AI value must be visible and editable).
      // Flutter applies it (its form has the condition dropdown).

      // Photo wins over any pre-photo selection (incl. shop memory) — the AI
      // saw the actual item. A no-op apply (AI agrees with the current
      // selection) must not run the branch: it would wipe customFields typed
      // during the wait and strand isLoadingUserDefaultsRef (the categoryId
      // effect never re-fires on the same value).
      const sameAsCurrent =
        draft.categoryId?.toString() === snapshot.categoryId &&
        (draft.subcategoryId ? draft.subcategoryId.toString() : '') === snapshot.subcategoryId;
      if (draft.categoryId && !sameAsCurrent) {
        // Same ref trick as user defaults/suggestions: stop the categoryId
        // effect from clearing the subcategory we set alongside it.
        isLoadingUserDefaultsRef.current = true;
        updates.categoryId = draft.categoryId.toString();
        updates.subcategoryId = draft.subcategoryId ? draft.subcategoryId.toString() : '';
        loadSubcategories(draft.categoryId);
        setCustomFields({});
        setCustomFieldsErrors({});
        marks.add('category');
      }

      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
      }
      if (marks.size > 0) setAiFilled(marks);
      return marks.size > 0;
    },
    [loadSubcategories]
  );

  // AI autofill trigger: the first photos landing, typed fields or not — a
  // seller who typed a title first still gets the full AI fill (photo wins).
  // Fail-open: error or data:null = no suggestions, the form behaves as today.
  useEffect(() => {
    if (images.length === 0) {
      // All photos removed — allow a fresh photo set to trigger a new draft
      aiDraftRequestedRef.current = false;
      return;
    }
    if (aiDraftRequestedRef.current) return;
    aiDraftRequestedRef.current = true;
    setAiDraftLoading(true);
    const requestImages = images;
    apiClient
      .getAiDraft(images.slice(0, 3))
      .then((res) => {
        // Stale response: the photos this draft was made from are gone
        if (imagesRef.current.length === 0 || imagesRef.current[0] !== requestImages[0]) return;
        const draft = res?.data;
        if (!draft) {
          setAiFillOutcome('none');
          aiDraftRequestedRef.current = false; // new/changed photos may retry
          return;
        }
        if (draft.unsellableReason === 'explicit') {
          // Prohibited content: remove the photos and block this set outright
          // (the server has already filed the user report)
          setImages([]);
          setAiFillOutcome('explicit');
          return;
        }
        setAiSellable(draft.sellable);
        setAiPriceEstimate(draft.priceEstimate);
        setAiUnsellableReason(draft.unsellableReason ?? null);
        const applied = draft.sellable ? applyAiDraft(draft) : false;
        setAiFillOutcome(applied ? 'filled' : 'none');
        if (!applied) aiDraftRequestedRef.current = false; // retry on new photos
      })
      .catch((err) => {
        console.warn('AI draft unavailable:', err);
        // A 429 is OUR quota, not the seller's photos — say so honestly
        setAiFillOutcome(err?.response?.status === 429 ? 'limited' : 'none');
        aiDraftRequestedRef.current = false; // retry on new photos
      })
      .finally(() => setAiDraftLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  // The ✨ badge disappears the moment the user edits that field
  const clearAiMark = useCallback((field: string) => {
    setAiFilled((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  // Handle loading a draft
  const handleLoadDraft = useCallback(
    (draft: AdDraft) => {
      setIsLoadingDraft(true);

      if (draft.customFields && Object.keys(draft.customFields).length > 0) {
        pendingDraftCustomFieldsRef.current = draft.customFields;
      }

      if (draft.categoryId) {
        loadSubcategories(parseInt(draft.categoryId));
      }

      // MERGE into prev — a full replace drops fields the draft doesn't carry
      // (whatsappSameAsPhone/whatsappNumber), and submit then crashes on them.
      setFormData((prev) => ({
        ...prev,
        title: draft.title,
        description: draft.description,
        price: draft.price,
        categoryId: draft.categoryId,
        subcategoryId: draft.subcategoryId,
        locationSlug: draft.locationSlug,
        locationName: draft.locationName,
        isNegotiable: draft.isNegotiable || false,
        isCodAvailable: draft.isCodAvailable || false,
      }));

      // A restored draft must show the full form even when it has no typed
      // title/description yet (photos/price/category-only drafts).
      setDraftRestored(true);
      loadDraft(draft.id);
      setShowDrafts(false);
    },
    [loadDraft, loadSubcategories]
  );

  // Handle starting a new ad
  const handleStartNew = useCallback(() => {
    startNewDraft();
    setDraftRestored(false);
    setShowDrafts(false);
  }, [startNewDraft]);

  // Handle category change
  const handleCategoryChange = useCallback(
    (newCategoryId: string) => {
      clearAiMark('category');
      setIsLoadingDraft(false);
      pendingDraftCustomFieldsRef.current = null;

      setFormData((prev) => ({ ...prev, categoryId: newCategoryId, subcategoryId: '' }));

      if (newCategoryId) {
        loadSubcategories(parseInt(newCategoryId));
      } else {
        setSubcategories([]);
      }

      setCustomFields({});
      setCustomFieldsErrors({});
    },
    [loadSubcategories]
  );

  // Handle custom field change
  const handleCustomFieldChange = useCallback((fieldName: string, value: any) => {
    setCustomFields((prev) => ({ ...prev, [fieldName]: value }));
    setCustomFieldsErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Handle form submission (runSubmit is also called by the AI confirm dialog's
  // "Post anyway", which is why it takes no event)
  const runSubmit = useCallback(
    async () => {
      setError('');

      if (!phoneVerified) {
        setError(
          'Please verify your phone number before posting an ad. Go to Profile → Security to verify.'
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (!formData.categoryId) {
        setError(t('errSelectCategory'));
        return;
      }

      if (subcategories.length > 0 && !formData.subcategoryId) {
        setError(t('errSelectSubcategory'));
        return;
      }

      if (!formData.locationSlug) {
        setError(t('errSelectLocation'));
        return;
      }

      if (images.length === 0) {
        setError(t('errUploadImage'));
        return;
      }

      // Matrimonials has no price input at all; a Jobs salary may be left blank.
      if (
        !categoryPolicy.price.hidden &&
        categoryPolicy.price.required &&
        (!formData.price || parseFloat(formData.price) <= 0)
      ) {
        setError(t('errValidPrice'));
        return;
      }

      if (fields.length > 0) {
        const { isValid, errors } = validateFields(customFields);
        if (!isValid) {
          setCustomFieldsErrors(errors);
          setError(t('errRequiredFields'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      // Pre-post AI checks — warnings only, never hard blocks (owner decision):
      // junk photos, absurd price vs the AI estimate, unreviewed AI-filled fields.
      if (!aiConfirmedRef.current) {
        const warnings: string[] = [];
        // Selfie gets its own wording; other declines share the generic warning
        if (aiSellable === false) {
          warnings.push(aiUnsellableReason === 'selfie' ? 'junkSelfie' : 'junk');
        }
        const typedPrice = parseFloat(formData.price);
        if (
          aiPriceEstimate &&
          typedPrice > 0 &&
          (typedPrice < aiPriceEstimate * 0.1 || typedPrice > aiPriceEstimate * 10)
        ) {
          warnings.push('price');
        }
        if (aiFilled.size > 0) warnings.push('aiFilled');
        // Server pre-check only when title or category is the seller's own
        // work (AI-filled-and-untouched fields were already chosen from the
        // photos). Fail-open: any trouble adds no warnings.
        if (!aiFilled.has('title') || !aiFilled.has('category')) {
          try {
            setSubmitting(true);
            const pre = await apiClient.precheckAd({
              title: formData.title,
              description: formData.description || null,
              categoryName:
                categories.find((c) => c.id.toString() === formData.categoryId)?.name ?? null,
              price: parseFloat(formData.price) || null,
            });
            for (const w of pre?.data?.warnings ?? []) {
              if (w.code === 'category_mismatch') warnings.push('categoryMismatch');
              if (w.code === 'spelling') warnings.push('spelling');
            }
          } catch {
            // fail-open — never let an advisory check block posting
          } finally {
            setSubmitting(false);
          }
        }
        if (warnings.length > 0) {
          setAiConfirm(warnings);
          return;
        }
      }

      try {
        setSubmitting(true);

        let locationId: number | undefined = undefined;
        if (formData.locationSlug) {
          const locationResponse = await apiClient.getLocationBySlug(formData.locationSlug);
          if (locationResponse.success && locationResponse.data) {
            // A slug alone doesn't prove precision — a province slug is just as
            // valid a slug. Check the tier before it becomes the ad's location.
            const locationType = (locationResponse.data as { type?: string | null }).type;
            if (!isValidAdLocationTier(locationType)) {
              setError('Please choose a municipality or area — province and district are too broad for an ad.');
              return;
            }
            locationId = locationResponse.data.id;
          }
        }

        // Instant post: when every photo finished its background upload, send
        // only the staged ids (no file bytes). Any gap → classic upload.
        const stagedImageIds = images.map((file) => stagedIdsRef.current.get(file));
        const allStaged = images.length > 0 && stagedImageIds.every(Boolean);

        // Condition comes from the category's own Condition field, never from a
        // form-level default — an ad must not carry a flag its category hides.
        const attributes: Record<string, unknown> = { ...customFields };
        if (categoryPolicy.condition === 'hidden' || !attributes.condition) {
          delete attributes.condition;
        }
        // Persist negotiable/COD inside custom_fields so they survive + pre-fill
        // on edit (mirrors the mobile app; the top-level field is dropped).
        if (categoryPolicy.negotiable) attributes.isNegotiable = formData.isNegotiable;
        if (categoryPolicy.cod) attributes.isCodAvailable = formData.isCodAvailable;
        // Only persist a WhatsApp number when it actually differs from the
        // verified phone — same rule the mobile app applies, so an ad posted
        // from either client stores the identical shape.
        if (
          !formData.whatsappSameAsPhone &&
          formData.whatsappNumber.trim() &&
          formData.whatsappNumber.trim() !== userPhone
        ) {
          attributes.whatsapp_number = formData.whatsappNumber.trim();
        }

        const priceInput = formData.price.trim();
        const adData = {
          title: formData.title,
          description: formData.description,
          // No price (Matrimonials) or a blank optional salary is sent empty —
          // the API reads that as "no price" and leaves the column null.
          price: categoryPolicy.price.hidden || !priceInput ? '' : parseFloat(priceInput),
          isNegotiable: categoryPolicy.negotiable && formData.isNegotiable,
          categoryId: parseInt(formData.categoryId),
          subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
          locationId: locationId,
          images: images,
          stagedImageIds: allStaged ? (stagedImageIds as string[]) : undefined,
          attributes,
        };

        const response = await apiClient.createAd(adData);

        if (response.success && response.data) {
          clearCurrentDraft();

          trackPostAd({
            id: (response.data as { id?: number | string })?.id,
            title: formData.title,
            price: formData.price ? parseFloat(formData.price) : null,
          });

          if (!userHasDefaultLocation && formData.locationSlug) {
            try {
              const token = (session as any)?.backendToken;
              if (token) {
                await fetch('/api/user/location', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ locationSlug: formData.locationSlug }),
                });
              }
            } catch (err) {
              // Non-critical error - saving user default location failed
              console.warn('Failed to save user default location:', err);
            }
          }

          // Auto-save user's category if they don't have a default
          if (!userHasDefaultCategory && formData.categoryId) {
            try {
              const token = (session as any)?.backendToken;
              if (token) {
                // Save both category and subcategory separately
                await fetch('/api/user/category', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    categoryId: parseInt(formData.categoryId),
                    subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : null,
                  }),
                });
              }
            } catch (err) {
              // Non-critical error - saving user default category failed
              console.warn('Failed to save user default category:', err);
            }
          }

          // Show the "under review" modal; redirect happens when the user closes it.
          const created = response.data as { id?: number; slug?: string; status?: string };
          postedAdSlugRef.current = created.slug ?? null;
          if (created.status === 'approved') {
            // Verified business: published instantly.
            adPostedLiveRef.current = true;
            setAdPostedLive(true);
          } else if (created.id) {
            // Watch for an instant AI publish while the modal is open — the
            // modal flips to "your ad is live" the moment it lands.
            let tries = 0;
            // Owner-only edit-context, NOT the public get-ad endpoint — that
            // one increments view_count, and a poll must not inflate views.
            approvalPollRef.current = setInterval(async () => {
              tries += 1;
              try {
                const r = await apiClient.getAdEditContext(created.id as number);
                const s = r?.data?.status;
                if (s === 'approved' || s === 'active') {
                  adPostedLiveRef.current = true;
                  setAdPostedLive(true);
                  clearApprovalPoll();
                  return;
                }
                if (s && s !== 'pending') clearApprovalPoll();
              } catch {
                // Advisory only — polling trouble never affects the flow
              }
              if (tries >= 5) clearApprovalPoll();
            }, 2500);
          }
          setAdPosted(true);
        }
      } catch (err: any) {
        console.error('Error creating ad:', err);
        // Re-arm the pre-post checks: the seller will likely edit fields
        // before retrying, and a stale "confirmed" flag would skip every
        // warning and the server precheck on the retry.
        aiConfirmedRef.current = false;
        setError(err.message || t('errCreateFailed'));
      } finally {
        setSubmitting(false);
      }
    },
    [
      formData,
      images,
      phoneVerified,
      fields,
      customFields,
      subcategories,
      validateFields,
      clearCurrentDraft,
      userHasDefaultLocation,
      userHasDefaultCategory,
      session,
      router,
      lang,
      aiSellable,
      aiPriceEstimate,
      aiUnsellableReason,
      aiFilled,
      categoryPolicy,
    ]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      runSubmit();
    },
    [runSubmit]
  );

  // AI confirm dialog: "Post anyway" proceeds once and for all; "Review again" just closes
  const handleAiConfirmProceed = useCallback(() => {
    aiConfirmedRef.current = true;
    setAiConfirm(null);
    runSubmit();
  }, [runSubmit]);

  const handleAiConfirmReview = useCallback(() => {
    setAiConfirm(null);
  }, []);

  const handleAdPostedClose = useCallback(() => {
    // Live (business direct-publish or instant AI approval) → the ad's own
    // page; still pending → dashboard Pending tab, as always.
    if (adPostedLiveRef.current && postedAdSlugRef.current) {
      router.push(`/${lang}/ad/${postedAdSlugRef.current}`);
    } else {
      router.push(`/${lang}/dashboard?tab=pending`);
    }
  }, [router, lang]);

  return {
    // Auth status
    status,
    // Form state
    formData,
    setFormData,
    images,
    setImages,
    categories,
    subcategories,
    // Loading states
    loading,
    loadingSubcategories,
    error,
    submitting,
    // User state
    userPhone,
    phoneVerified,
    // Draft state
    showDrafts,
    drafts,
    isSaving,
    lastSaved,
    getDraftDisplayName,
    formatDraftDate,
    deleteDraft,
    // Dynamic fields
    fields,
    customFields,
    customFieldsErrors,
    selectedSubcategory,
    categoryPolicy,
    // AI autofill
    aiDraftLoading,
    aiFillOutcome,
    aiUnsellableReason,
    aiFilled,
    clearAiMark,
    aiConfirm,
    handleAiConfirmProceed,
    handleAiConfirmReview,
    // Handlers
    handleLoadDraft,
    handleStartNew,
    handleCategoryChange,
    handleCustomFieldChange,
    handleSubmit,
    adPosted,
    adPostedLive,
    draftRestored,
    handleAdPostedClose,
    // Verification status for image limits
    isUserVerified:
      session?.user?.businessVerificationStatus === 'approved' ||
      session?.user?.businessVerificationStatus === 'verified' ||
      session?.user?.individualVerified === true,
  };
}
