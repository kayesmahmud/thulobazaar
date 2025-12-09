// @ts-nocheck
'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import DynamicFormFields from '@/components/post-ad/DynamicFormFields';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import { useFormTemplate } from '@/hooks/useFormTemplate';
import { useAdDraft, AdDraft } from '@/hooks/useAdDraft';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui';

interface PostAdPageProps {
  params: Promise<{ lang: string }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_id?: number | null;
  parentId?: number | null;
  subcategories?: Category[];
}

export default function PostAdPage({ params }: PostAdPageProps) {
  const { lang } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    subcategoryId: '',
    locationSlug: '',
    locationName: '', // Track location name for display in input
    condition: 'new',
    isNegotiable: false,
  });

  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userHasDefaultLocation, setUserHasDefaultLocation] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
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
      router.push(`/${lang}/auth/signin`);
      return;
    }

    // Load categories and locations
    if (status === 'authenticated') {
      loadFormData();
    }
  }, [status, router, lang]);

  // Load subcategories when category changes
  useEffect(() => {
    if (formData.categoryId && formData.categoryId !== '') {
      loadSubcategories(parseInt(formData.categoryId));
    } else {
      setSubcategories([]);
    }

    // Only clear subcategory and custom fields when category changes manually (not when loading draft)
    if (!isLoadingDraft) {
      if (formData.subcategoryId) {
        setFormData(prev => ({ ...prev, subcategoryId: '' }));
      }
      setCustomFields({});
      setCustomFieldsErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.categoryId]); // Only depend on categoryId

  // Initialize custom fields when template fields change
  useEffect(() => {
    if (fields.length > 0) {
      // If we have pending draft custom fields, use those instead of initial values
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
  }, [fields.length]); // Only trigger when fields change, not on every render

  // Auto-save draft when form data changes
  useEffect(() => {
    // Don't save if form is empty or during initial load
    if (!formData.title && !formData.description && !formData.price && !formData.categoryId) {
      return;
    }

    saveDraft(formData, customFields);
  }, [formData, customFields, saveDraft]);

  // Handle loading a draft
  const handleLoadDraft = useCallback((draft: AdDraft) => {
    // Set flag to prevent clearing subcategory/customFields when category changes
    setIsLoadingDraft(true);

    // Store custom fields to be restored after template fields load (using ref to avoid re-renders)
    if (draft.customFields && Object.keys(draft.customFields).length > 0) {
      pendingDraftCustomFieldsRef.current = draft.customFields;
    }

    // Load subcategories for the draft's category first
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

    // Load the draft into the hook's current draft tracking
    loadDraft(draft.id);
    setShowDrafts(false);
  }, [loadDraft]);

  // Handle starting a new ad (hide drafts)
  const handleStartNew = useCallback(() => {
    startNewDraft();
    setShowDrafts(false);
  }, [startNewDraft]);

  const loadFormData = async () => {
    try {
      setLoading(true);

      const [categoriesRes, locationsRes] = await Promise.all([
        apiClient.getCategories(), // Returns parent categories with nested subcategories
        apiClient.getLocations({ type: 'municipality' }),
      ]);

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      // Fetch user's profile to check phone verification status and default location
      try {
        const profileRes = await fetch('/api/profile', {
          credentials: 'include',
        });
        const profileData = await profileRes.json();

        if (profileData.success && profileData.data) {
          setUserPhone(profileData.data.phone || null);
          setPhoneVerified(profileData.data.phoneVerified || false);
        }
      } catch (profileErr) {
        // Non-critical error, continue without profile data
      }

      // Fetch user's default location and pre-select it
      try {
        const token = (session as any)?.backendToken;
        if (token) {
          const userLocationRes = await fetch('/api/user/location', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const userLocationData = await userLocationRes.json();

          if (userLocationData.success && userLocationData.data?.location) {
            const userLocation = userLocationData.data.location;
            setFormData(prev => ({
              ...prev,
              locationSlug: userLocation.slug || '',
              locationName: userLocation.name || '',
            }));
            setUserHasDefaultLocation(true);
          } else {
            setUserHasDefaultLocation(false);
          }
        }
      } catch (locationErr) {
        // Non-critical error, continue without pre-selection
      }
    } catch (err: any) {
      console.error('Error loading form data:', err);
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = (parentId: number) => {
    setLoadingSubcategories(true);
    const parentCategory = categories.find((cat: any) => cat.id === parentId);

    if (parentCategory?.subcategories && Array.isArray(parentCategory.subcategories)) {
      setSubcategories(parentCategory.subcategories);
    } else {
      setSubcategories([]);
    }
    setLoadingSubcategories(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Phone verification check
    if (!phoneVerified) {
      setError('Please verify your phone number before posting an ad. Go to Profile → Security to verify.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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

      // Convert location slug to ID
      let locationId: number | undefined = undefined;
      if (formData.locationSlug) {
        const locationResponse = await apiClient.getLocationBySlug(formData.locationSlug);
        if (locationResponse.success && locationResponse.data) {
          locationId = locationResponse.data.id;
        }
      }

      // Prepare form data for API
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
          ...customFields, // ✅ Include dynamic fields
        },
      };

      const response = await apiClient.createAd(adData);

      if (response.success && response.data) {
        // Clear the draft on successful post
        clearCurrentDraft();

        // If user didn't have a default location and they selected one, save it as default
        if (!userHasDefaultLocation && formData.locationSlug) {
          try {
            const token = (session as any)?.backendToken;
            if (token) {
              await fetch('/api/user/location', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ locationSlug: formData.locationSlug }),
              });
            }
          } catch (saveLocationErr) {
            // Non-critical error, continue with redirect
          }
        }

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              Post a Free Ad
            </h1>
            {/* Auto-save indicator */}
            {(isSaving || lastSaved) && (
              <span style={{
                fontSize: '0.75rem',
                color: isSaving ? '#6b7280' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}>
                {isSaving ? (
                  <>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#6b7280', animation: 'pulse 1s infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    Draft saved
                  </>
                )}
              </span>
            )}
          </div>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Fill in the details below to create your listing
          </p>
        </div>

        {/* Saved Drafts List */}
        {showDrafts && drafts.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                Saved Drafts ({drafts.length})
              </h2>
              <button
                onClick={handleStartNew}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                + Start New Ad
              </button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 0.25rem 0',
                      fontWeight: '500',
                      color: '#1f2937',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {getDraftDisplayName(draft)}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                      Last edited: {formatDraftDate(draft.updatedAt)}
                      {draft.categoryId && (
                        <span style={{ marginLeft: '0.5rem' }}>
                          • {categories.find(c => c.id.toString() === draft.categoryId)?.name || 'Category selected'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      onClick={() => handleLoadDraft(draft)}
                      style={{
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      style={{
                        background: 'transparent',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show form only when not showing drafts or when drafts are dismissed */}
        {(!showDrafts || drafts.length === 0) && (
          <>
        {/* Phone Verification Warning */}
        {!loading && !phoneVerified && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{
                fontWeight: '600',
                color: '#92400e',
                margin: '0 0 0.25rem 0',
                fontSize: '0.9375rem'
              }}>
                Phone verification required
              </p>
              <p style={{
                color: '#92400e',
                margin: 0,
                fontSize: '0.875rem',
                lineHeight: 1.5
              }}>
                To post ads and let buyers contact you, please verify your phone number first.
                {userPhone ? (
                  <> Your phone <strong>{userPhone}</strong> is not yet verified.</>
                ) : (
                  <> You haven&apos;t added a phone number yet.</>
                )}
              </p>
              <Link
                href={`/${lang}/profile`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginTop: '0.75rem',
                  padding: '0.5rem 1rem',
                  background: '#f59e0b',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}
              >
                Verify Phone in Security Settings →
              </Link>
            </div>
          </div>
        )}

        {/* Verified Phone Display */}
        {!loading && phoneVerified && userPhone && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1rem', color: '#10b981' }}>✓</span>
            <span style={{ color: '#047857', fontSize: '0.875rem' }}>
              Contact phone: <strong>{userPhone}</strong> (verified)
            </span>
          </div>
        )}

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

                  // Reset draft loading flag since user is manually changing
                  setIsLoadingDraft(false);
                  pendingDraftCustomFieldsRef.current = null;

                  // Update form data
                  setFormData({ ...formData, categoryId: newCategoryId, subcategoryId: '' });

                  // Load subcategories immediately
                  if (newCategoryId) {
                    loadSubcategories(parseInt(newCategoryId));
                  } else {
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
            <div style={{
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
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
              <small style={{
                display: 'block',
                marginTop: '0.75rem',
                color: '#6b7280',
                fontSize: '0.75rem'
              }}>
                Select the most specific location for your ad (area/place preferred)
              </small>
            </div>
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
            <Button
              type="submit"
              variant="success"
              loading={submitting}
              disabled={submitting}
            >
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
