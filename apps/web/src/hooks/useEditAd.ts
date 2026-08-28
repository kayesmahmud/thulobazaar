'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getCategoryPolicy } from '@thulobazaar/types';
import { useFormTemplate } from '@/hooks/useFormTemplate';
import { apiClient } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: number | null;
}

interface EditAdFormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  subcategoryId: string;
  locationSlug: string;
  locationName: string;
  isNegotiable: boolean;
}

const INITIAL_FORM_DATA: EditAdFormData = {
  title: '',
  description: '',
  price: '',
  categoryId: '',
  subcategoryId: '',
  locationSlug: '',
  locationName: '',
  isNegotiable: false,
};

const normalizeConditionForForm = (condition?: string | null): string | null => {
  // No condition on the ad -> leave it unset (don't invent one for rentals/services/etc.)
  if (!condition || !String(condition).trim()) return null;

  const value = String(condition).toLowerCase();

  if (value === 'new' || value === 'brand new') return 'Brand New';
  return 'Used'; // Any other non-empty value normalizes to Used
};

export function useEditAd(adId: number, lang: string) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<EditAdFormData>(INITIAL_FORM_DATA);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tracking states
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastCategoryId, setLastCategoryId] = useState<string>('');
  const [fieldsInitialized, setFieldsInitialized] = useState(false);

  // Ad status tracking
  const [adStatus, setAdStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isApproved, setIsApproved] = useState(false);
  // Server-decided edit policy for live ads (which warning to show, what happens on save)
  const [editContext, setEditContext] = useState<{
    status: string;
    canDirectPublish: boolean;
    willGoToPending: boolean;
    editLimit?: number;
    editsUsed?: number;
    editsRemaining?: number;
  } | null>(null);

  // Custom fields state
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [customFieldsErrors, setCustomFieldsErrors] = useState<Record<string, string>>({});

  // Get selected category and subcategory objects for template hook
  const selectedCategory =
    categories.find((c) => c.id.toString() === formData.categoryId) || null;
  const selectedSubcategory =
    subcategories.find((c) => c.id.toString() === formData.subcategoryId) || null;

  // Which of Price / Negotiable / COD / Condition this category actually has —
  // the same policy the post-ad form obeys (@thulobazaar/types).
  const categoryPolicy = getCategoryPolicy(
    selectedCategory?.slug ?? '',
    selectedSubcategory?.slug
  );

  // Use template hook to get dynamic fields
  const { fields, validateFields, getInitialValues } = useFormTemplate(
    selectedCategory,
    selectedSubcategory,
    categories
  );

  const loadSubcategories = useCallback(async (parentId: number) => {
    try {
      setLoadingSubcategories(true);
      const response = await apiClient.getCategories({ includeSubcategories: true });

      if (response.success && response.data) {
        const parentCategory = response.data.find((cat: any) => cat.id === parentId) as any;
        const nestedSubs =
          parentCategory?.subcategories || parentCategory?.other_categories || [];

        if (parentCategory && Array.isArray(nestedSubs)) {
          setSubcategories(nestedSubs);
        } else {
          // Fallback: try to filter from flattened list
          const flattenedSubs: any[] = [];
          response.data.forEach((cat: any) => {
            const nested = cat.subcategories || cat.other_categories;
            if (nested && Array.isArray(nested)) {
              nested.forEach((subcat: any) => {
                if (Number(subcat.parent_id) === parentId) {
                  flattenedSubs.push(subcat);
                }
              });
            }
          });
          setSubcategories(flattenedSubs);
        }
      } else {
        setSubcategories([]);
      }
    } catch (err) {
      console.error('Error loading subcategories:', err);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Step 1: Fetch ALL categories
      const allCategoriesRes = await apiClient.getCategories({ includeSubcategories: true });
      if (!allCategoriesRes.success || !allCategoriesRes.data) {
        setError('Failed to load categories');
        return;
      }

      const allCategories = allCategoriesRes.data;

      // Build parent categories and subcategories map
      const parentCategories: any[] = [];
      const subcategoriesMap: Map<number, any[]> = new Map();

      allCategories.forEach((cat: any) => {
        const parentId = cat.parent_id ?? cat.parentId;
        if (parentId === null || parentId === undefined) {
          parentCategories.push(cat);
          const nestedSubs = cat.subcategories || cat.other_categories || [];
          if (Array.isArray(nestedSubs) && nestedSubs.length > 0) {
            subcategoriesMap.set(cat.id, nestedSubs);
          }
        }
      });

      // Step 2: Load the ad data
      const adRes = await apiClient.getAdById(adId);
      if (!adRes.success || !adRes.data) {
        setError('Failed to load ad');
        return;
      }

      const ad: any = adRes.data;

      // Check ownership
      const adOwnerId = ad.user?.id || ad.user_id || ad.userId;
      const currentUserId = parseInt(session?.user?.id || '0');

      if (adOwnerId !== currentUserId) {
        setError('You do not have permission to edit this ad');
        return;
      }

      // Check if ad is approved
      const status = ad.status || '';
      const statusReason = ad.statusReason || ad.status_reason || '';

      setAdStatus(status);
      setRejectionReason(statusReason);

      // Live ads are editable now — ask the server what saving will do
      // (re-review for normal users, instant publish for trusted businesses)
      if (status === 'approved' || status === 'active') {
        setIsApproved(true);
        try {
          const ctxRes = await apiClient.getAdEditContext(adId);
          if (ctxRes.success && ctxRes.data) {
            setEditContext(ctxRes.data);
          } else {
            setEditContext({ status, canDirectPublish: false, willGoToPending: true });
          }
        } catch {
          // Safe default: warn that the ad goes back to review
          setEditContext({ status, canDirectPublish: false, willGoToPending: true });
        }
      }

      // Step 3: Determine category structure
      let parentCategoryId = '';
      let subcategoryId = '';
      let loadedSubcategories: Category[] = [];

      // API returns 'categories' (plural) for the relation
      const adCategory = ad.categories || ad.category;
      const adCategoryId = adCategory?.id || ad.category_id || ad.categoryId;
      const adCategoryParentId = adCategory?.parentId || adCategory?.parent_id;

      if (adCategoryId) {
        if (adCategoryParentId) {
          parentCategoryId = String(adCategoryParentId);
          subcategoryId = String(adCategoryId);
          const parentIdNum = Number(adCategoryParentId);
          loadedSubcategories = subcategoriesMap.get(parentIdNum) || [];
        } else {
          parentCategoryId = String(adCategoryId);
          subcategoryId = '';
          const parentIdNum = Number(adCategoryId);
          loadedSubcategories = subcategoriesMap.get(parentIdNum) || [];
        }
      }

      // Step 4: Extract custom fields
      let extractedCustomFields: Record<string, any> = {};
      const adCustomFields = ad.customFields || ad.custom_fields;

      if (adCustomFields && typeof adCustomFields === 'object') {
        extractedCustomFields = { ...adCustomFields };
      }

      if (ad.attributes && typeof ad.attributes === 'object') {
        extractedCustomFields = { ...extractedCustomFields, ...ad.attributes };
      }

      if (ad.condition) {
        extractedCustomFields.condition = ad.condition;
      }

      // Pre-fill the existing condition if present; do NOT invent one when the
      // ad has none (e.g. rentals/services) — otherwise editing would silently
      // stamp a condition back onto the ad.
      const normalizedCondition = normalizeConditionForForm(extractedCustomFields.condition);
      if (normalizedCondition) {
        extractedCustomFields.condition = normalizedCondition;
      } else {
        delete extractedCustomFields.condition;
      }

      // Step 5: Get location info (API returns 'locations' plural for the relation)
      const adLocation = ad.locations || ad.location;
      const locationSlug = adLocation?.slug || '';
      const locationName = adLocation?.name || '';

      console.log('📊 [useEditAd] Loading ad data:', {
        parentCategoryId,
        subcategoryId,
        locationSlug,
        locationName,
        adCategory,
        adLocation,
        parentCategoriesCount: parentCategories.length,
        loadedSubcategoriesCount: loadedSubcategories.length,
      });

      // Step 6: Set states
      console.log('📊 [useEditAd] Parent categories:', parentCategories.map(c => ({ id: c.id, name: c.name })));
      console.log('📊 [useEditAd] Category ID 3 exists?', parentCategories.some(c => c.id === 3));
      setCategories(parentCategories as Category[]);

      if (loadedSubcategories.length > 0) {
        setSubcategories(loadedSubcategories);
      }

      const newFormData = {
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price?.toString() || '',
        categoryId: parentCategoryId,
        subcategoryId: subcategoryId,
        locationSlug: locationSlug,
        locationName: locationName,
        isNegotiable: adCustomFields?.isNegotiable ?? ad.isNegotiable ?? false,
      };
      console.log('📊 [useEditAd] Setting formData:', newFormData);
      setFormData(newFormData);

      setLastCategoryId(parentCategoryId);

      if (Object.keys(extractedCustomFields).length > 0) {
        setCustomFields(extractedCustomFields);
      }

      // Set existing images
      if (ad.images && ad.images.length > 0) {
        const normalizePath = (p: string) =>
          p.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '');

        const imagePaths = ad.images
          .map((img: any) => {
            if (typeof img === 'string') return img;
            return img.filePath || img.file_path || '';
          })
          .filter((p: string) => !!p)
          .map(normalizePath);

        setExistingImages(imagePaths);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Failed to load ad data');
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [adId, session?.user?.id]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, lang, loadData]);

  // Load subcategories when category changes (only after initial load)
  useEffect(() => {
    if (!initialLoadComplete) return;
    if (formData.categoryId === lastCategoryId) return;

    setLastCategoryId(formData.categoryId);

    if (formData.categoryId && formData.categoryId !== '') {
      loadSubcategories(parseInt(formData.categoryId));
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId, initialLoadComplete, lastCategoryId, loadSubcategories]);

  // Initialize custom fields when template fields change (only after initial load and only once per category change)
  useEffect(() => {
    // Skip during initial load - custom fields are loaded from the ad data in loadData()
    if (!initialLoadComplete || loading) return;

    // If we have fields and they haven't been initialized yet, merge initial values
    if (fields.length > 0 && getInitialValues && !fieldsInitialized) {
      const initialValues = getInitialValues();
      setCustomFields((prev) => ({ ...initialValues, ...prev }));
      setFieldsInitialized(true);
    }
  }, [fields.length, loading, getInitialValues, initialLoadComplete, fieldsInitialized]);

  // A category with no Negotiable input must not keep submitting the old value
  useEffect(() => {
    if (categoryPolicy.negotiable) return;
    setFormData((prev) => (prev.isNegotiable ? { ...prev, isNegotiable: false } : prev));
  }, [categoryPolicy.negotiable]);

  // Handlers
  const handleFormChange = useCallback((updates: Partial<EditAdFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setFormData((prev) => ({ ...prev, categoryId, subcategoryId: '' }));
      if (categoryId) {
        loadSubcategories(parseInt(categoryId));
      } else {
        setSubcategories([]);
      }
      setCustomFields({});
      setCustomFieldsErrors({});
      setFieldsInitialized(false); // Reset so new category's fields get initialized
    },
    [loadSubcategories]
  );

  const handleCustomFieldChange = useCallback((fieldName: string, value: any) => {
    setCustomFields((prev) => ({ ...prev, [fieldName]: value }));
    setCustomFieldsErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const handleRemoveExistingImage = useCallback((index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      // Validation
      if (!formData.categoryId) {
        setError('Please select a category');
        return;
      }

      if (existingImages.length === 0 && images.length === 0) {
        setError('Please keep at least one image');
        return;
      }

      // Matrimonials has no price input at all; a Jobs salary may be left blank.
      if (
        !categoryPolicy.price.hidden &&
        categoryPolicy.price.required &&
        (!formData.price || parseFloat(formData.price) <= 0)
      ) {
        setError('Please enter a valid price');
        return;
      }

      // Validate custom fields
      if (fields.length > 0) {
        const { isValid, errors } = validateFields(customFields);
        if (!isValid) {
          setCustomFieldsErrors(errors);
          setError('Please fill in all required fields');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      // Editing a live ad as a non-trusted user takes it offline — confirm first
      if (isApproved && editContext?.willGoToPending) {
        const confirmed = window.confirm(
          'Saving these changes will take your ad OFFLINE and send it back for review. It will go live again once our team approves it.\n\nContinue?'
        );
        if (!confirmed) return;
      }

      try {
        setSubmitting(true);

        // Convert location slug to ID
        let locationId: number | undefined = undefined;
        if (formData.locationSlug) {
          const locationResponse = await apiClient.getLocationBySlug(formData.locationSlug);
          if (locationResponse.success && locationResponse.data) {
            locationId = locationResponse.data.id;
          }
        }

        // Condition / negotiable / COD only exist where the category policy
        // allows them, so an edit also strips whatever a legacy ad still carries.
        const attributes: Record<string, unknown> = { ...customFields };
        if (categoryPolicy.condition === 'hidden' || !attributes.condition) {
          delete attributes.condition;
        }
        if (categoryPolicy.negotiable) {
          // Persist negotiable inside custom_fields so it survives + pre-fills
          // on edit (mirrors the mobile app; the top-level field is dropped).
          attributes.isNegotiable = formData.isNegotiable;
        } else {
          delete attributes.isNegotiable;
        }
        if (!categoryPolicy.cod) {
          delete attributes.isCodAvailable;
        }

        // Prepare update data
        const priceInput = formData.price.trim();
        const updateData = {
          title: formData.title,
          description: formData.description,
          // Categories with no price input, and blank optional ones, send nothing
          // rather than a NaN the API would reject.
          price:
            categoryPolicy.price.hidden || !priceInput ? undefined : parseFloat(priceInput),
          isNegotiable: categoryPolicy.negotiable && formData.isNegotiable,
          categoryId: parseInt(formData.categoryId),
          subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
          locationId: locationId,
          images: images.length > 0 ? images : undefined,
          existingImages: existingImages,
          attributes,
        };

        const response = await apiClient.updateAd(adId, updateData);

        if (response.success) {
          // If the edit sent the ad back to review, land on the dashboard
          // (the public ad page is offline now); otherwise show the live ad.
          if (response.resultingStatus === 'pending') {
            router.push(`/${lang}/dashboard`);
          } else {
            const updatedAdResponse = await apiClient.getAdById(adId);
            if (updatedAdResponse.success && updatedAdResponse.data) {
              const slug = updatedAdResponse.data.slug;
              router.push(`/${lang}/ad/${slug}`);
            } else {
              router.push(`/${lang}/dashboard`);
            }
          }
        } else {
          setError('Failed to update ad. Please try again.');
        }
      } catch (err: any) {
        console.error('Error updating ad:', err);
        setError(err.message || 'Failed to update ad. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [
      formData,
      existingImages,
      images,
      fields,
      customFields,
      validateFields,
      adId,
      router,
      lang,
      isApproved,
      editContext,
      categoryPolicy,
    ]
  );

  return {
    // State
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
    editContext,
    customFields,
    customFieldsErrors,
    fields,
    status,
    selectedCategory,
    selectedSubcategory,
    categoryPolicy,

    // Actions
    setImages,
    handleFormChange,
    handleCategoryChange,
    handleCustomFieldChange,
    handleRemoveExistingImage,
    handleSubmit,
    // Verification status for image limits
    isUserVerified:
      session?.user?.businessVerificationStatus === 'approved' ||
      session?.user?.businessVerificationStatus === 'verified' ||
      session?.user?.individualVerified === true,
  };
}
