// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useFormTemplate } from '@/hooks/useFormTemplate';
import { useAdDraft, AdDraft } from '@/hooks/useAdDraft';
import { apiClient } from '@/lib/api';
import type { Category, PostAdFormData } from './types';
import { INITIAL_FORM_DATA } from './types';

export function usePostAd(lang: string) {
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

  // User state
  const [userHasDefaultLocation, setUserHasDefaultLocation] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Draft state
  const [showDrafts, setShowDrafts] = useState(true);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const pendingDraftCustomFieldsRef = useRef<Record<string, unknown> | null>(null);

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
        apiClient.getCategories(),
        apiClient.getLocations({ type: 'municipality' }),
      ]);

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
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

          if (userLocationData.success && userLocationData.data?.location) {
            const userLocation = userLocationData.data.location;
            setFormData((prev) => ({
              ...prev,
              locationSlug: userLocation.slug || '',
              locationName: userLocation.name || '',
            }));
            setUserHasDefaultLocation(true);
          } else {
            setUserHasDefaultLocation(false);
          }
        }
      } catch (err) {
        // Non-critical error - user location fetch failed
        console.warn('Failed to fetch user location:', err);
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
    if (status === 'authenticated') {
      loadFormData();
    }
  }, [status, router, lang, loadFormData]);

  // Load subcategories when category changes
  useEffect(() => {
    if (formData.categoryId && formData.categoryId !== '') {
      loadSubcategories(parseInt(formData.categoryId));
    } else {
      setSubcategories([]);
    }

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

  // Auto-save draft
  useEffect(() => {
    if (!formData.title && !formData.description && !formData.price && !formData.categoryId) {
      return;
    }
    saveDraft(formData, customFields);
  }, [formData, customFields, saveDraft]);

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

      setFormData({
        title: draft.title,
        description: draft.description,
        price: draft.price,
        categoryId: draft.categoryId,
        subcategoryId: draft.subcategoryId,
        locationSlug: draft.locationSlug,
        locationName: draft.locationName,
        condition: draft.condition || 'new',
        isNegotiable: draft.isNegotiable || false,
      });

      loadDraft(draft.id);
      setShowDrafts(false);
    },
    [loadDraft, loadSubcategories]
  );

  // Handle starting a new ad
  const handleStartNew = useCallback(() => {
    startNewDraft();
    setShowDrafts(false);
  }, [startNewDraft]);

  // Handle category change
  const handleCategoryChange = useCallback(
    (newCategoryId: string) => {
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

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!phoneVerified) {
        setError(
          'Please verify your phone number before posting an ad. Go to Profile → Security to verify.'
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (!formData.categoryId) {
        setError('Please select a category');
        return;
      }

      if (images.length === 0) {
        setError('Please upload at least one image');
        return;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError('Please enter a valid price');
        return;
      }

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

        let locationId: number | undefined = undefined;
        if (formData.locationSlug) {
          const locationResponse = await apiClient.getLocationBySlug(formData.locationSlug);
          if (locationResponse.success && locationResponse.data) {
            locationId = locationResponse.data.id;
          }
        }

        const adData = {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          isNegotiable: formData.isNegotiable,
          categoryId: parseInt(formData.categoryId),
          subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
          locationId: locationId,
          images: images,
          attributes: {
            condition: formData.condition,
            ...customFields,
          },
        };

        const response = await apiClient.createAd(adData);

        if (response.success && response.data) {
          clearCurrentDraft();

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

          router.push(`/${lang}/dashboard`);
        }
      } catch (err: any) {
        console.error('Error creating ad:', err);
        setError(err.message || 'Failed to create ad. Please try again.');
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
      validateFields,
      clearCurrentDraft,
      userHasDefaultLocation,
      session,
      router,
      lang,
    ]
  );

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
    // Handlers
    handleLoadDraft,
    handleStartNew,
    handleCategoryChange,
    handleCustomFieldChange,
    handleSubmit,
  };
}
