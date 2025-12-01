// @ts-nocheck
'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import DynamicFormFields from '@/components/post-ad/DynamicFormFields';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import { useFormTemplate } from '@/hooks/useFormTemplate';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui';

interface EditAdPageProps {
  params: Promise<{ lang: string; id: string }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: number | null;
}

export default function EditAdPage({ params }: EditAdPageProps) {
  const { lang, id } = use(params);
  const adId = parseInt(id);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state - SAME ORDER AS POST-AD
  const [formData, setFormData] = useState({
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
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Flag to skip useEffect during initial load
  const [lastCategoryId, setLastCategoryId] = useState<string>(''); // Track last category to detect manual changes

  // Dynamic form fields state
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [customFieldsErrors, setCustomFieldsErrors] = useState<Record<string, string>>({});

  // Get selected category and subcategory objects for template hook
  const selectedCategory = categories.find(c => c.id.toString() === formData.categoryId) || null;
  const selectedSubcategory = subcategories.find(c => c.id.toString() === formData.subcategoryId) || null;

  // Use template hook to get dynamic fields
  const { fields, validateFields, getInitialValues } = useFormTemplate(
    selectedCategory,
    selectedSubcategory,
    categories
  );

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }

    // Load data when authenticated
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, lang, adId]);

  // Load subcategories when category changes (only AFTER initial load is complete)
  // During initial load, subcategories are already set by loadData()
  useEffect(() => {
    // Skip this effect during initial page load - loadData() already sets subcategories
    if (!initialLoadComplete) {
      return;
    }

    // Only reload subcategories if the category actually CHANGED (user manually changed it)
    // Skip if this is the first run after initialLoadComplete (category hasn't changed yet)
    if (formData.categoryId === lastCategoryId) {
      return;
    }

    // Update lastCategoryId to track changes
    setLastCategoryId(formData.categoryId);

    if (formData.categoryId && formData.categoryId !== '') {
      loadSubcategories(parseInt(formData.categoryId));
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId, initialLoadComplete, lastCategoryId]);

  // Initialize custom fields when template fields change
  // For edit page, we merge template defaults with loaded ad data (ad data takes priority)
  useEffect(() => {
    if (fields.length > 0 && getInitialValues && !loading) {
      const initialValues = getInitialValues();
      // Merge: template defaults first, then existing customFields override
      // This ensures ad data takes priority over template defaults
      setCustomFields(prev => {
        const merged = { ...initialValues, ...prev };
        console.log('🔍 Merging custom fields:', { initialValues, prev, merged });
        return merged;
      });
    }
  }, [fields.length, loading]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Step 1: Fetch ALL categories (including subcategories) in one call
      const allCategoriesRes = await apiClient.getCategories({ includeSubcategories: true });
      if (!allCategoriesRes.success || !allCategoriesRes.data) {
        setError('Failed to load categories');
        return;
      }

      const allCategories = allCategoriesRes.data;
      console.log('🔍 All categories fetched:', allCategories.length, 'categories');
      console.log('🔍 Sample category structure:', allCategories[0]);

      // The API returns parent categories with subcategories nested in 'subcategories'
      // (older responses used 'other_categories' - keep backward compatibility)
      // We need to build a map of parent -> subcategories for easy lookup
      const parentCategories: any[] = [];
      const subcategoriesMap: Map<number, any[]> = new Map();

      allCategories.forEach((cat: any) => {
        const parentId = cat.parent_id ?? cat.parentId;
        if (parentId === null || parentId === undefined) {
          // This is a parent category
          parentCategories.push(cat);

          const nestedSubs = cat.subcategories || cat.other_categories || [];
          if (Array.isArray(nestedSubs) && nestedSubs.length > 0) {
            subcategoriesMap.set(cat.id, nestedSubs);
            console.log(`🔍 Parent ${cat.id} (${cat.name}) has ${nestedSubs.length} subcategories:`, nestedSubs.map((s: any) => ({ id: s.id, name: s.name })));
          }
        }
      });

      console.log('🔍 Parent categories:', parentCategories.length, parentCategories.map((c: any) => ({ id: c.id, name: c.name })));
      console.log('🔍 Subcategories map size:', subcategoriesMap.size);

      // Step 2: Load the ad data
      const adRes = await apiClient.getAdById(adId);
      if (!adRes.success || !adRes.data) {
        setError('Failed to load ad');
        return;
      }

      const ad: any = adRes.data;
      console.log('🔍 Full ad data:', ad);

      // Check ownership - user is nested as ad.user.id in the API response
      const adOwnerId = ad.user?.id || ad.user_id || ad.userId;
      const currentUserId = parseInt(session?.user?.id || '0');

      console.log('🔍 Ownership check:', { adOwnerId, currentUserId, adUser: ad.user });

      if (adOwnerId !== currentUserId) {
        setError('You do not have permission to edit this ad');
        return;
      }

      // Step 3: Determine category structure and load subcategories
      let parentCategoryId = '';
      let subcategoryId = '';
      let loadedSubcategories: Category[] = [];

      // The API returns category as an object with id, parentId, etc.
      const adCategoryId = ad.category?.id || ad.category_id || ad.categoryId;
      const adCategoryParentId = ad.category?.parentId || ad.category?.parent_id;

      console.log('🔍 Category data from ad:', { adCategoryId, adCategoryParentId, category: ad.category });

      if (adCategoryId) {
        if (adCategoryParentId) {
          // This is a subcategory - parentId exists
          parentCategoryId = String(adCategoryParentId);
          subcategoryId = String(adCategoryId);

          // Get subcategories for this parent from our map
          const parentIdNum = Number(adCategoryParentId);
          loadedSubcategories = subcategoriesMap.get(parentIdNum) || [];

          console.log('🔍 Found subcategories for parent', parentIdNum, 'from map:', loadedSubcategories.length, loadedSubcategories.map((s: any) => ({ id: s.id, name: s.name })));
        } else {
          // This is a parent category (no subcategory)
          parentCategoryId = String(adCategoryId);
          subcategoryId = '';

          // Also get subcategories in case user wants to select one
          const parentIdNum = Number(adCategoryId);
          loadedSubcategories = subcategoriesMap.get(parentIdNum) || [];
          console.log('🔍 Parent category selected, available subcategories:', loadedSubcategories.length);
        }
      }

      console.log('🔍 Final category IDs:', { parentCategoryId, subcategoryId });

      // Step 4: Extract ALL custom fields including condition
      let extractedCustomFields: Record<string, any> = {};

      // API returns customFields (camelCase), also check snake_case for safety
      const adCustomFields = ad.customFields || ad.custom_fields;

      console.log('🔍 Custom fields data:', { customFields: ad.customFields, custom_fields: ad.custom_fields, attributes: ad.attributes });

      // First, get from customFields
      if (adCustomFields && typeof adCustomFields === 'object') {
        extractedCustomFields = { ...adCustomFields };
      }

      // Then merge with attributes (this might have condition)
      if (ad.attributes && typeof ad.attributes === 'object') {
        extractedCustomFields = { ...extractedCustomFields, ...ad.attributes };
      }

      // If condition is in the root level, add it to custom fields
      if (ad.condition) {
        extractedCustomFields.condition = ad.condition;
      }

      // Ensure condition has a value (default to 'new' if not present)
      if (!extractedCustomFields.condition) {
        extractedCustomFields.condition = 'new';
      }

      console.log('🔍 Extracted custom fields:', extractedCustomFields);

      // Step 6: Get location slug and name from the ad's location object
      const locationSlug = ad.location?.slug || '';
      const locationName = ad.location?.name || '';

      // Step 7: Set ALL states together to avoid race conditions
      // Set categories FIRST (before formData references them)
      setCategories(parentCategories as Category[]);

      // Set subcategories if we have them
      if (loadedSubcategories.length > 0) {
        console.log('🔍 Setting subcategories:', loadedSubcategories.length, loadedSubcategories);
        setSubcategories(loadedSubcategories);
      } else {
        console.log('🔍 No subcategories found to set!');
      }

      console.log('🔍 Setting form data with:', { parentCategoryId, subcategoryId });

      // Step 8: Populate form with ALL existing data
      setFormData({
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price?.toString() || '',
        categoryId: parentCategoryId,
        subcategoryId: subcategoryId,
        locationSlug: locationSlug,
        locationName: locationName,
        condition: 'new', // Condition is now in customFields, not formData
        isNegotiable: adCustomFields?.isNegotiable ?? ad.isNegotiable ?? false,
        status: ad.status || 'active',
      });

      // Set lastCategoryId to prevent useEffect from re-fetching subcategories on first run
      setLastCategoryId(parentCategoryId);

      // Step 9: Set custom fields AFTER form data
      if (Object.keys(extractedCustomFields).length > 0) {
        setCustomFields(extractedCustomFields);
      }

      // Step 10: Set existing images - extract file_path/filePath and normalize
      if (ad.images && ad.images.length > 0) {
        const normalizePath = (p: string) =>
          p
            .replace(/^https?:\/\/[^/]+\//, '') // drop domain if present
            .replace(/^\/+/, ''); // drop leading slash

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
      console.error('❌ Error loading data:', err);
      setError('Failed to load ad data');
    } finally {
      setLoading(false);
      // Mark initial load as complete - this allows the useEffect for subcategories
      // to work normally when user manually changes category
      setInitialLoadComplete(true);
    }
  };

  const loadSubcategories = async (parentId: number) => {
    try {
      setLoadingSubcategories(true);
      const response = await apiClient.getCategories({ includeSubcategories: true });

      if (response.success && response.data) {
        // The API returns subcategories nested in 'subcategories' (keep fallback to other_categories)
        // Find the parent category and get its subcategories
        const parentCategory = response.data.find((cat: any) => cat.id === parentId);

        const nestedSubs =
          parentCategory?.subcategories ||
          (parentCategory as any)?.other_categories ||
          [];

        if (parentCategory && Array.isArray(nestedSubs)) {
          const subs = nestedSubs;
          console.log('🔍 loadSubcategories found', subs.length, 'for parent', parentId);
          setSubcategories(subs);
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
          console.log('🔍 loadSubcategories (fallback) found', flattenedSubs.length, 'for parent', parentId);
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
  };

  const handleRemoveExistingImage = (index: number) => {
    const newExistingImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExistingImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Validate custom fields if any
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
        // Fetch the updated ad to get its slug
        const updatedAdResponse = await apiClient.getAdById(adId);

        if (updatedAdResponse.success && updatedAdResponse.data) {
          const slug = updatedAdResponse.data.slug;
          router.push(`/${lang}/ad/${slug}`);
        } else {
          // Fallback to dashboard if we can't get the slug
          router.push(`/${lang}/dashboard`);
        }
      } else {
        setError('Failed to update ad. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ [EDIT AD] Error updating ad:', err);
      setError(err.message || 'Failed to update ad. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Loading ad...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
          <Link
            href={`/${lang}/dashboard`}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Breadcrumb */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <Link href={`/${lang}`} style={{ color: '#667eea', textDecoration: 'none' }}>
              Home
            </Link>
            <span>/</span>
            <Link href={`/${lang}/dashboard`} style={{ color: '#667eea', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <span>/</span>
            <span>Edit Ad</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
            Edit Your Ad
          </h1>
          <p style={{ color: '#6b7280' }}>
            Update your listing details below
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        {/* Form - EXACT SAME ORDER AS POST-AD */}
        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {/* Ad Status */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Ad Status
            </h2>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
            >
              <option value="active">Active (Visible to buyers)</option>
              <option value="sold">Sold (Mark as sold)</option>
              <option value="inactive">Inactive (Hidden from listings)</option>
            </select>
          </div>

          {/* Ad Details - SAME AS POST-AD */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Ad Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ad Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., iPhone 15 Pro Max 256GB"
                  required
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem'
                  }}
                />
                <small style={{ color: '#6b7280' }}>{formData.title.length}/100</small>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item in detail..."
                  required
                  rows={6}
                  maxLength={5000}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
                <small style={{ color: '#6b7280' }}>{formData.description.length}/5000</small>
              </div>

              {/* Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                    Price (NPR) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="50000"
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              {/* Negotiable */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.isNegotiable}
                    onChange={(e) => setFormData({ ...formData, isNegotiable: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '500', color: '#374151' }}>Price is negotiable</span>
                </label>
              </div>
            </div>
          </div>

          {/* Category Selection - SAME AS POST-AD */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Category *
            </h2>

            {/* Main Category Dropdown */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Select Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => {
                  const newCategoryId = e.target.value;
                  setFormData({ ...formData, categoryId: newCategoryId, subcategoryId: '' });
                  if (newCategoryId) {
                    loadSubcategories(parseInt(newCategoryId));
                  } else {
                    setSubcategories([]);
                  }
                  setCustomFields({});
                  setCustomFieldsErrors({});
                }}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
              >
                <option value="">-- Select Main Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.icon || '📦'} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Dropdown */}
            {formData.categoryId && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Select Subcategory *
                </label>
                <select
                  value={formData.subcategoryId}
                  onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                  disabled={loadingSubcategories}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    backgroundColor: loadingSubcategories ? '#f3f4f6' : 'white',
                    cursor: loadingSubcategories ? 'wait' : 'pointer'
                  }}
                >
                  <option value="">
                    {loadingSubcategories ? 'Loading subcategories...' : '-- Select Subcategory --'}
                  </option>
                  {!loadingSubcategories && subcategories.map((sub) => (
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
              onChange={(fieldName, value) => {
                setCustomFields({ ...customFields, [fieldName]: value });
                if (customFieldsErrors[fieldName]) {
                  const newErrors = { ...customFieldsErrors };
                  delete newErrors[fieldName];
                  setCustomFieldsErrors(newErrors);
                }
              }}
              subcategoryName={selectedSubcategory?.name}
            />
          )}

          {/* Photos Section - ImageUpload component handles both existing and new images */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Photos *
            </h2>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={10}
              maxSizeMB={5}
              existingImages={existingImages}
              onRemoveExisting={(index) => {
                const newExisting = existingImages.filter((_, i) => i !== index);
                setExistingImages(newExisting);
              }}
            />
          </div>

          {/* Location */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '1rem'
            }}>
              <h3 style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#111827'
              }}>
                Location (Area/Place) *
              </h3>
              <CascadingLocationFilter
                onLocationSelect={(locationSlug, locationName) => {
                  setFormData(prev => ({
                    ...prev,
                    locationSlug: locationSlug || '',
                    locationName: locationName || ''
                  }));
                }}
                selectedLocationSlug={formData.locationSlug || null}
                selectedLocationName={formData.locationName || null}
              />
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <Link
              href={`/${lang}/dashboard`}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: 'white',
                textDecoration: 'none',
                color: '#374151',
                fontWeight: '500'
              }}
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="success"
              loading={submitting}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
