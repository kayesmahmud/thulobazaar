'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import DynamicFormFields from '@/components/post-ad/DynamicFormFields';
import LocationSelector from '@/components/LocationSelector';
import { useFormTemplate } from '@/hooks/useFormTemplate';
import { apiClient } from '@/lib/api';

interface PostAdPageProps {
  params: Promise<{ lang: string }>;
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

export default function PostAdPage({ params }: PostAdPageProps) {
  const { lang } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  console.log('🚀 PostAdPage component rendered');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    subcategoryId: '',
    locationId: '',
    locationType: '', // Store location type to know if it's an area or other location type
    condition: 'new',
    isNegotiable: false,
  });

  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debug: Log current state
  console.log('📊 Current State:', {
    categoriesCount: categories.length,
    subcategoriesCount: subcategories.length,
    selectedCategoryId: formData.categoryId,
    selectedSubcategoryId: formData.subcategoryId
  });

  // Dynamic form fields state
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [customFieldsErrors, setCustomFieldsErrors] = useState<Record<string, string>>({});

  // Get selected category and subcategory objects for template hook
  const selectedCategory = categories.find(c => c.id.toString() === formData.categoryId) || null;
  const selectedSubcategory = subcategories.find(c => c.id.toString() === formData.subcategoryId) || null;

  // Use template hook to get dynamic fields
  const { fields, validateFields, getInitialValues, templateType } = useFormTemplate(
    selectedCategory,
    selectedSubcategory,
    categories
  );

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/login`);
      return;
    }

    // Load categories and locations
    if (status === 'authenticated') {
      loadFormData();
    }
  }, [status, router, lang]);

  // Load subcategories when category changes
  useEffect(() => {
    console.log('🔥 USEEFFECT FIRED! Category ID:', formData.categoryId);

    if (formData.categoryId && formData.categoryId !== '') {
      console.log('📋 Loading subcategories for category ID:', formData.categoryId);
      loadSubcategories(parseInt(formData.categoryId));
    } else {
      console.log('📋 No category selected, clearing subcategories');
      setSubcategories([]);
    }

    // Always clear subcategory and custom fields when category changes
    if (formData.subcategoryId) {
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
    }
    setCustomFields({});
    setCustomFieldsErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.categoryId]); // Only depend on categoryId

  // Initialize custom fields when template fields change
  useEffect(() => {
    if (fields.length > 0 && getInitialValues) {
      const initialValues = getInitialValues();
      setCustomFields(initialValues);
      setCustomFieldsErrors({});
    }
  }, [fields.length]);

  const loadFormData = async () => {
    try {
      setLoading(true);

      const [categoriesRes, locationsRes] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getLocations({ type: 'municipality' }),
      ]);

      if (categoriesRes.success && categoriesRes.data) {
        // Filter parent categories only
        const parentCategories = categoriesRes.data.filter(
          (cat) => cat.parent_id === null
        );
        setCategories(parentCategories);
      }

      if (locationsRes.success && locationsRes.data) {
        setLocations(locationsRes.data);
      }
    } catch (err: any) {
      console.error('Error loading form data:', err);
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (parentId: number) => {
    try {
      setLoadingSubcategories(true);
      console.log('🔍 Fetching ALL categories (including subcategories) from API...');

      // Fetch ALL categories with includeSubcategories=true
      const response = await apiClient.getCategories({ includeSubcategories: true });

      if (response.success && response.data) {
        console.log('✅ Total categories fetched (all):', response.data.length);

        // Filter to get only subcategories for this parent
        const subs = response.data.filter((cat) => cat.parent_id === parentId);
        console.log(`🎯 Found ${subs.length} subcategories for parent ID ${parentId}:`, subs.map(s => s.name));

        setSubcategories(subs);
      } else {
        console.warn('⚠️ Failed to fetch categories:', response);
        setSubcategories([]);
      }
    } catch (err) {
      console.error('❌ Error loading subcategories:', err);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
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

      // Prepare form data for API
      // Only send areaId if the location type is 'area', otherwise send locationId
      const locationData = formData.locationId
        ? (formData.locationType === 'area'
            ? { areaId: parseInt(formData.locationId) }
            : { locationId: parseInt(formData.locationId) })
        : {};

      const adData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        isNegotiable: formData.isNegotiable,
        categoryId: parseInt(formData.categoryId),
        subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
        ...locationData, // Spread either areaId or locationId based on type
        images: images,
        attributes: {
          condition: formData.condition,
          ...customFields, // ✅ Include dynamic fields
        },
      };

      const response = await apiClient.createAd(adData);

      if (response.success && response.data) {
        // Success! Redirect to the new ad or dashboard
        router.push(`/${lang}/dashboard`);
      }
    } catch (err: any) {
      console.error('Error creating ad:', err);
      setError(err.message || 'Failed to create ad. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
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
            <span>Post an Ad</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
            Post a Free Ad
          </h1>
          <p style={{ color: '#6b7280' }}>
            Fill in the details below to create your listing
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {/* Ad Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Ad Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          {/* Category Selection */}
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
                  console.log('🎯 Category dropdown changed to:', newCategoryId);

                  // Update form data
                  setFormData({ ...formData, categoryId: newCategoryId, subcategoryId: '' });

                  // Load subcategories immediately
                  if (newCategoryId) {
                    console.log('🚀 Immediately loading subcategories for:', newCategoryId);
                    loadSubcategories(parseInt(newCategoryId));
                  } else {
                    console.log('🚫 No category selected, clearing subcategories');
                    setSubcategories([]);
                  }

                  // Clear custom fields
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

            {/* Subcategory Dropdown - ALWAYS show when category is selected */}
            {(() => {
              console.log('🔍 Subcategory render check:', {
                categoryId: formData.categoryId,
                subcategoriesCount: subcategories.length,
                loadingSubcategories: loadingSubcategories,
                subcategories: subcategories.map(s => s.name)
              });
              return null;
            })()}
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
                  onChange={(e) => {
                    console.log('📝 Subcategory selected:', e.target.value);
                    setFormData({ ...formData, subcategoryId: e.target.value });
                  }}
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
          {(() => {
            console.log('🎨 Dynamic fields render check:', {
              fieldsCount: fields.length,
              selectedCategory: selectedCategory?.name,
              selectedSubcategory: selectedSubcategory?.name,
              templateType: templateType
            });
            return null;
          })()}
          {fields.length > 0 && (
            <DynamicFormFields
              fields={fields}
              values={customFields}
              errors={customFieldsErrors}
              onChange={(fieldName, value) => {
                console.log('📝 Dynamic field changed:', fieldName, '=', value);
                setCustomFields({ ...customFields, [fieldName]: value });
                // Clear error for this field
                if (customFieldsErrors[fieldName]) {
                  const newErrors = { ...customFieldsErrors };
                  delete newErrors[fieldName];
                  setCustomFieldsErrors(newErrors);
                }
              }}
              subcategoryName={selectedSubcategory?.name}
            />
          )}

          {/* Images */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Photos *
            </h2>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={10}
              maxSizeMB={5}
            />
          </div>

          {/* Location */}
          <div style={{ marginBottom: '2rem' }}>
            <LocationSelector
              onLocationSelect={(location) => {
                console.log('📍 Location selected:', location);
                setFormData(prev => ({
                  ...prev,
                  locationId: location ? location.id.toString() : '',
                  locationType: location ? location.type : ''
                }));
              }}
              selectedLocationId={formData.locationId ? parseInt(formData.locationId) : null}
              label="Location (Area/Place)"
              placeholder="Search area (e.g., Thamel, Samakhushi)..."
              required
              filterType="area"
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <Link
              href={`/${lang}`}
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
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                border: 'none',
                background: submitting ? '#9ca3af' : '#10b981',
                color: 'white',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {submitting ? 'Posting...' : 'Post Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
