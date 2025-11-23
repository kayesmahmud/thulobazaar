// @ts-nocheck
'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import DynamicFormFields from '@/components/post-ad/DynamicFormFields';
import LocationHierarchySelector from '@/components/LocationHierarchySelector';
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

interface Location {
  id: number;
  name: string;
  type: string;
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
    locationId: '',
    locationType: '',
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

  // Load subcategories when category changes
  useEffect(() => {
    if (formData.categoryId && formData.categoryId !== '') {
      loadSubcategories(parseInt(formData.categoryId));
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId]);

  // Initialize custom fields when template fields change (only if not already loaded from ad)
  useEffect(() => {
    // Only set default values if we don't have custom fields loaded from the ad
    if (fields.length > 0 && getInitialValues && Object.keys(customFields).length === 0 && !loading) {
      const initialValues = getInitialValues();
      // Merge with existing custom fields (in case some were set from ad data)
      setCustomFields(prev => ({ ...initialValues, ...prev }));
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

      // Separate parent categories for the main dropdown
      const parentCategories = allCategories.filter(cat => (cat as any).parent_id === null || (cat as any).parentId === null);
      setCategories(parentCategories as any);

      // Step 2: Load the ad data
      const adRes = await apiClient.getAdById(adId);
      if (!adRes.success || !adRes.data) {
        setError('Failed to load ad');
        return;
      }

      const ad: any = adRes.data;

      // Check ownership
      if ((ad as any).user_id !== parseInt(session?.user?.id || '0') && (ad as any).userId !== parseInt(session?.user?.id || '0')) {
        setError('You do not have permission to edit this ad');
        return;
      }

      // Step 3: Determine category structure and load subcategories
      let parentCategoryId = '';
      let subcategoryId = '';

      if (ad.category_id) {
        const adCategory: any = allCategories.find(c => c.id === ad.category_id);

        if (adCategory) {
          if (adCategory.parent_id || adCategory.parentId) {
            // This is a subcategory
            parentCategoryId = adCategory.parent_id.toString();
            subcategoryId = ad.category_id.toString();

            // Load and set subcategories for this parent IMMEDIATELY
            const subs = allCategories.filter(cat => (cat as any).parent_id === adCategory.parent_id || (cat as any).parentId === adCategory.parentId);
            setSubcategories(subs);
          } else {
            // This is a parent category (no subcategory)
            parentCategoryId = ad.category_id.toString();
            subcategoryId = '';
          }
        }
      }

      // Step 4: Extract ALL custom fields including condition
      let extractedCustomFields: Record<string, any> = {};

      // First, get from custom_fields
      if (ad.custom_fields && typeof ad.custom_fields === 'object') {
        extractedCustomFields = { ...ad.custom_fields };
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

      // Step 6: Get location ID (could be location_id or area_id)
      const locationIdValue = ad.location_id || ad.area_id || ad.locationId || '';

      // Step 7: Populate form with ALL existing data
      setFormData({
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price?.toString() || '',
        categoryId: parentCategoryId,
        subcategoryId: subcategoryId,
        locationId: locationIdValue ? locationIdValue.toString() : '',
        locationType: '', // Will be set by LocationSelector
        condition: 'new', // Condition is now in customFields, not formData
        isNegotiable: (ad.custom_fields as any)?.isNegotiable ?? false,
        status: ad.status || 'active',
      });

      // Step 7: Set custom fields AFTER form data
      if (Object.keys(extractedCustomFields).length > 0) {
        setCustomFields(extractedCustomFields);
      }

      // Step 8: Set existing images - extract file_path from image objects
      if (ad.images && ad.images.length > 0) {
        // If images is an array of objects with file_path, extract the paths
        const imagePaths = ad.images.map((img: any) =>
          typeof img === 'string' ? img : img.file_path || img
        );
        setExistingImages(imagePaths);
      }

    } catch (err: any) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load ad data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (parentId: number) => {
    try {
      setLoadingSubcategories(true);
      const response = await apiClient.getCategories({ includeSubcategories: true });

      if (response.success && response.data) {
        const subs = response.data.filter((cat) => cat.parent_id === parentId);
        setSubcategories(subs);
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

      // Prepare location data
      const locationData = formData.locationId
        ? (formData.locationType === 'area'
            ? { areaId: parseInt(formData.locationId) }
            : { locationId: parseInt(formData.locationId) })
        : {};

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        isNegotiable: formData.isNegotiable,
        categoryId: parseInt(formData.categoryId),
        subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
        ...locationData,
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
                  <option key={cat.id} value={cat.id}>
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
            <LocationHierarchySelector
              onLocationSelect={(location) => {
                setFormData({
                  ...formData,
                  locationId: location ? location.id.toString() : '',
                  locationType: location ? location.type : ''
                });
              }}
              selectedLocationId={formData.locationId ? parseInt(formData.locationId) : null}
              label="Location"
              placeholder="Search province, district, municipality..."
              required
            />
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
