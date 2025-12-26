'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  condition: string;
  isNegotiable: boolean;
  status: string;
}

const INITIAL_FORM_DATA: EditAdFormData = {
  title: '',
  description: '',
  price: '',
  categoryId: '',
  subcategoryId: '',
  locationSlug: '',
  locationName: '',
  condition: 'new',
  isNegotiable: false,
  status: 'active',
};

const normalizeConditionForForm = (condition?: string) => {
  if (!condition) return '';

  const value = String(condition).toLowerCase();

  if (value === 'new' || value === 'brand new') return 'Brand New';
  if (value === 'used') return 'Used';
  if (value === 'reconditioned') return 'Reconditioned';

  return typeof condition === 'string' ? condition : String(condition);
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

  // Custom fields state
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [customFieldsErrors, setCustomFieldsErrors] = useState<Record<string, string>>({});

  // Get selected category and subcategory objects for template hook
  const selectedCategory =
    categories.find((c) => c.id.toString() === formData.categoryId) || null;
  const selectedSubcategory =
    subcategories.find((c) => c.id.toString() === formData.subcategoryId) || null;

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

      if (status === 'approved') {
        setIsApproved(true);
        setError(
          'This ad has been approved and published. Approved ads cannot be edited to maintain content integrity. If you need to make changes, please contact support or create a new ad.'
        );
        return;
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

      if (!extractedCustomFields.condition) {
        extractedCustomFields.condition = 'new';
      }

      const normalizedCondition = normalizeConditionForForm(extractedCustomFields.condition);
      if (normalizedCondition) {
        extractedCustomFields.condition = normalizedCondition;
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
        condition: (ad.condition || '').toLowerCase() === 'used' ? 'used' : 'new',
        isNegotiable: adCustomFields?.isNegotiable ?? ad.isNegotiable ?? false,
        status: ad.status || 'active',
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

      if (!formData.price || parseFloat(formData.price) <= 0) {
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

        // Prepare update data
        const updateData = {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          isNegotiable: formData.isNegotiable,
          categoryId: parseInt(formData.categoryId),
          subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
          locationId: locationId,
          status: formData.status,
          images: images.length > 0 ? images : undefined,
          existingImages: existingImages,
          attributes: {
            condition: formData.condition,
            ...customFields,
          },
        };

        const response = await apiClient.updateAd(adId, updateData);

        if (response.success) {
          const updatedAdResponse = await apiClient.getAdById(adId);
          if (updatedAdResponse.success && updatedAdResponse.data) {
            const slug = updatedAdResponse.data.slug;
            router.push(`/${lang}/ad/${slug}`);
          } else {
            router.push(`/${lang}/dashboard`);
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
    customFields,
    customFieldsErrors,
    fields,
    status,
    selectedCategory,
    selectedSubcategory,

    // Actions
    setImages,
    handleFormChange,
    handleCategoryChange,
    handleCustomFieldChange,
    handleRemoveExistingImage,
    handleSubmit,
  };
}
