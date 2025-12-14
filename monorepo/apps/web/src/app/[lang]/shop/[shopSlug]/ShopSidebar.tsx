'use client';

import { useState, useEffect } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { Phone01, Globe01, MarkerPin01, MarkerPin02, Tag01 } from '@untitledui-pro/icons/line';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareWhatsapp } from '@fortawesome/free-brands-svg-icons';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import ReportShopButton from './ReportShopButton';

// Helper to ensure URL has proper protocol
const ensureHttps = (url: string): string => {
  if (!url) return url;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

// Extended user type with backendToken (added by UserAuthContext from NextAuth session)
type UserWithToken = {
  id: number;
  backendToken?: string | null;
};

interface ShopSidebarProps {
  shopId: number;
  shopSlug: string;
  shopName: string;
  lang: string;
  bio: string | null;
  businessDescription: string | null;
  businessPhone: string | null;
  phone: string | null;
  phoneVerified?: boolean;
  businessWebsite: string | null;
  googleMapsLink: string | null;
  locationName: string | null;
  locationSlug: string | null;
  locationFullPath: string | null;
  // Category props (main category)
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  // Subcategory props
  subcategoryId: number | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
  subcategoryIcon: string | null;
}

export default function ShopSidebar({
  shopId,
  shopSlug,
  shopName,
  lang,
  bio,
  businessDescription: initialDescription,
  businessPhone: initialBusinessPhone,
  phone: initialPhone,
  phoneVerified: initialPhoneVerified = false,
  businessWebsite: initialWebsite,
  googleMapsLink: initialGoogleMaps,
  locationName: initialLocationName,
  locationSlug: initialLocationSlug,
  locationFullPath: initialLocationFullPath,
  categoryId: initialCategoryId,
  categoryName: initialCategoryName,
  categorySlug: initialCategorySlug,
  categoryIcon: initialCategoryIcon,
  subcategoryId: initialSubcategoryId,
  subcategoryName: initialSubcategoryName,
  subcategorySlug: initialSubcategorySlug,
  subcategoryIcon: initialSubcategoryIcon,
}: ShopSidebarProps) {
  const { user, isAuthenticated } = useUserAuth();
  const [isOwner, setIsOwner] = useState(false);

  // Determine if current user is the shop owner
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsOwner(user.id === shopId);
    }
  }, [user, isAuthenticated, shopId]);

  // About section states - use bio as fallback for all users
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState(initialDescription || bio || '');
  const [aboutSaving, setAboutSaving] = useState(false);

  // Contact section states
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactData, setContactData] = useState({
    businessPhone: initialBusinessPhone || '',
    businessWebsite: initialWebsite || '',
    googleMapsLink: initialGoogleMaps || '',
  });
  const [contactSaving, setContactSaving] = useState(false);

  // WhatsApp same as verified phone toggle
  const [useVerifiedForWhatsApp, setUseVerifiedForWhatsApp] = useState(
    initialBusinessPhone === initialPhone && !!initialPhone
  );

  // Verified phone is read-only, displayed from initialPhone
  const verifiedPhone = initialPhone || '';
  const isPhoneVerified = initialPhoneVerified;

  // Location section states
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationSlug, setLocationSlug] = useState(initialLocationSlug || '');
  const [locationName, setLocationName] = useState(initialLocationName || '');
  const [locationFullPath, setLocationFullPath] = useState(initialLocationFullPath || '');
  const [locationSaving, setLocationSaving] = useState(false);

  // Category section states
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(initialSubcategoryId);
  const [categoryName, setCategoryName] = useState(initialCategoryName || '');
  const [subcategoryName, setSubcategoryName] = useState(initialSubcategoryName || '');
  const [categorySaving, setCategorySaving] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon: string | null }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when parent category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategoryId) {
        setSubcategories([]);
        return;
      }
      setLoadingSubcategories(true);
      try {
        const res = await fetch(`/api/categories/${selectedCategoryId}/subcategories`);
        const data = await res.json();
        if (data.success && data.data) {
          setSubcategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      } finally {
        setLoadingSubcategories(false);
      }
    };
    if (isEditingCategory && selectedCategoryId) {
      fetchSubcategories();
    }
  }, [selectedCategoryId, isEditingCategory]);

  // Set initial values when editing starts
  useEffect(() => {
    if (isEditingCategory) {
      setSelectedCategoryId(initialCategoryId);
      setSelectedSubcategoryId(initialSubcategoryId);
    }
  }, [isEditingCategory, initialCategoryId, initialSubcategoryId]);

  const handleSaveAbout = async () => {
    try {
      setAboutSaving(true);

      const token = (user as UserWithToken | null)?.backendToken;

      if (!token) {
        alert('You must be logged in to update this section. Please refresh the page and try again.');
        setAboutSaving(false);
        return;
      }

      const response = await fetch(`/api/shop/${shopSlug}/about`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ business_description: aboutText }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditingAbout(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update about section');
      }
    } catch (err) {
      console.error('Error updating about:', err);
      alert('Failed to update about section');
    } finally {
      setAboutSaving(false);
    }
  };

  const handleSaveContact = async () => {
    try {
      setContactSaving(true);

      const token = (user as UserWithToken | null)?.backendToken;

      if (!token) {
        alert('You must be logged in to update this section. Please refresh the page and try again.');
        setContactSaving(false);
        return;
      }

      // Determine WhatsApp number - use verified phone if toggle is on
      let whatsAppNumber = '';
      if (useVerifiedForWhatsApp && verifiedPhone) {
        // Use the verified phone number
        whatsAppNumber = verifiedPhone.startsWith('+977')
          ? verifiedPhone
          : `+977${verifiedPhone.replace(/\D/g, '')}`;
      } else if (contactData.businessPhone) {
        // Format manually entered phone with +977 prefix
        const digits = contactData.businessPhone.replace(/^\+977\s*/, '').replace(/\D/g, '');
        whatsAppNumber = digits ? `+977${digits}` : '';
      }

      const response = await fetch(`/api/shop/${shopSlug}/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_phone: whatsAppNumber || null,
          business_website: contactData.businessWebsite,
          google_maps_link: contactData.googleMapsLink,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditingContact(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update contact information');
      }
    } catch (err) {
      console.error('Error updating contact:', err);
      alert('Failed to update contact information');
    } finally {
      setContactSaving(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      setLocationSaving(true);

      const token = (user as UserWithToken | null)?.backendToken;

      if (!token) {
        alert('You must be logged in to update this section. Please refresh the page and try again.');
        setLocationSaving(false);
        return;
      }

      const response = await fetch(`/api/user/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          locationSlug: locationSlug || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditingLocation(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update location');
      }
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Failed to update location');
    } finally {
      setLocationSaving(false);
    }
  };

  const handleLocationSelect = (slug: string | null, name?: string | null, fullPath?: string | null) => {
    setLocationSlug(slug || '');
    setLocationName(name || '');
    setLocationFullPath(fullPath || name || '');
  };

  const handleCategoryChange = (catId: string) => {
    const id = catId ? parseInt(catId, 10) : null;
    setSelectedCategoryId(id);
    setSelectedSubcategoryId(null); // Reset subcategory when category changes
  };

  const handleSubcategoryChange = (subId: string) => {
    const id = subId ? parseInt(subId, 10) : null;
    setSelectedSubcategoryId(id);
  };

  const handleSaveCategory = async () => {
    try {
      setCategorySaving(true);

      const token = (user as UserWithToken | null)?.backendToken;

      if (!token) {
        alert('You must be logged in to update this section. Please refresh the page and try again.');
        setCategorySaving(false);
        return;
      }

      // Send both category and subcategory IDs
      const response = await fetch(`/api/user/category`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          subcategoryId: selectedSubcategoryId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditingCategory(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category');
    } finally {
      setCategorySaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* About Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">About</h2>
          {!isEditingAbout && isOwner && (
            <button
              onClick={() => setIsEditingAbout(true)}
              className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingAbout ? (
          <div>
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              maxLength={500}
              placeholder="Describe your business..."
              className="w-full min-h-[100px] sm:min-h-[120px] p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <div className="text-xs sm:text-sm text-gray-500 mt-2">
              {aboutText.length}/500 characters
            </div>
            <div className="flex gap-2 mt-3 sm:mt-4">
              <button
                onClick={handleSaveAbout}
                disabled={aboutSaving}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg font-semibold transition-colors disabled:opacity-60"
              >
                {aboutSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditingAbout(false);
                  setAboutText(initialDescription || '');
                }}
                disabled={aboutSaving}
                className="flex-1 border border-gray-300 px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
            {aboutText || 'No description available. Click Edit to add information about your business.'}
          </p>
        )}
      </div>

      {/* Contact Information */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Contact Information</h2>
          {!isEditingContact && isOwner && (
            <button
              onClick={() => setIsEditingContact(true)}
              className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingContact ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Verified Phone - Read Only */}
            {verifiedPhone && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Phone01 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Verified Mobile</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">{verifiedPhone}</div>
                <p className="text-xs text-gray-500 mt-1">
                  To change your verified phone, go to Profile &gt; Security tab
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                WhatsApp Number
              </label>

              {/* Toggle for using verified phone */}
              {verifiedPhone && isPhoneVerified && (
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useVerifiedForWhatsApp}
                    onChange={(e) => {
                      setUseVerifiedForWhatsApp(e.target.checked);
                      if (e.target.checked) {
                        // Auto-fill with verified phone (without +977 for display)
                        setContactData({
                          ...contactData,
                          businessPhone: verifiedPhone.replace(/^\+977\s*/, ''),
                        });
                      }
                    }}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    Same as my verified number ({verifiedPhone})
                  </span>
                </label>
              )}

              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm sm:text-base text-gray-600 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                  +977
                </span>
                <input
                  type="tel"
                  value={
                    useVerifiedForWhatsApp && verifiedPhone
                      ? verifiedPhone.replace(/^\+977\s*/, '').replace(/\D/g, '')
                      : contactData.businessPhone.replace(/^\+977\s*/, '')
                  }
                  onChange={(e) => {
                    // Only allow digits
                    const digits = e.target.value.replace(/\D/g, '');
                    setContactData({ ...contactData, businessPhone: digits });
                    // Uncheck the toggle if user manually edits
                    if (useVerifiedForWhatsApp) {
                      setUseVerifiedForWhatsApp(false);
                    }
                  }}
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                  disabled={useVerifiedForWhatsApp}
                  className={`flex-1 p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                    useVerifiedForWhatsApp ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {useVerifiedForWhatsApp
                  ? 'Using your verified phone number for WhatsApp'
                  : 'Enter 10-digit mobile number'}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Website
              </label>
              <input
                type="url"
                value={contactData.businessWebsite}
                onChange={(e) => setContactData({ ...contactData, businessWebsite: e.target.value })}
                placeholder="https://example.com"
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Google Maps Link
              </label>
              <input
                type="url"
                value={contactData.googleMapsLink}
                onChange={(e) => setContactData({ ...contactData, googleMapsLink: e.target.value })}
                placeholder="https://maps.google.com/?q=..."
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 mt-3 sm:mt-4">
              <button
                onClick={handleSaveContact}
                disabled={contactSaving}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg font-semibold transition-colors disabled:opacity-60"
              >
                {contactSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditingContact(false);
                  setContactData({
                    businessPhone: initialBusinessPhone || '',
                    businessWebsite: initialWebsite || '',
                    googleMapsLink: initialGoogleMaps || '',
                  });
                }}
                disabled={contactSaving}
                className="flex-1 border border-gray-300 px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {contactData.businessPhone && (
              <div className="flex items-center gap-2 sm:gap-3">
                <FontAwesomeIcon icon={faSquareWhatsapp} className="!w-5 !h-5 sm:!w-[30px] sm:!h-[30px] text-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">WhatsApp</div>
                  <div className="font-semibold text-sm sm:text-base break-all">{contactData.businessPhone}</div>
                </div>
              </div>
            )}
            {verifiedPhone && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Phone01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                    Mobile
                    {isPhoneVerified && (
                      <span className="inline-flex items-center gap-0.5 text-green-600 text-xs">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-sm sm:text-base break-all">{verifiedPhone}</div>
                </div>
              </div>
            )}
            {contactData.businessWebsite && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Globe01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-purple-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">Website</div>
                  <a
                    href={ensureHttps(contactData.businessWebsite)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-500 hover:underline font-semibold text-sm sm:text-base break-all"
                  >
                    {contactData.businessWebsite}
                  </a>
                </div>
              </div>
            )}
            {contactData.googleMapsLink && (
              <div className="flex items-center gap-2 sm:gap-3">
                <MarkerPin01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-red-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">Location</div>
                  <a
                    href={ensureHttps(contactData.googleMapsLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-500 hover:underline font-semibold text-sm sm:text-base"
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
            )}
            {!contactData.businessPhone && !verifiedPhone && !contactData.businessWebsite && !contactData.googleMapsLink && (
              <p className="text-sm sm:text-base text-gray-500 italic">
                No contact information available. {isOwner && 'Click Edit to add your contact details.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Default Category - Using centralized category system */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Category</h2>
          {!isEditingCategory && isOwner && (
            <button
              onClick={() => setIsEditingCategory(true)}
              className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingCategory ? (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Select Your Default Category
              </label>
              <p className="text-xs text-gray-500 mb-3">
                This will be pre-selected when you post new ads.
              </p>

              {/* Main Category Select */}
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={loadingCategories}
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">
                  {loadingCategories ? 'Loading categories...' : '-- Select Main Category --'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon || '📦'} {cat.name}
                  </option>
                ))}
              </select>

              {/* Subcategory Select */}
              {selectedCategoryId && (
                <div className="mt-3">
                  <select
                    value={selectedSubcategoryId || ''}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    disabled={loadingSubcategories}
                    className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">
                      {loadingSubcategories ? 'Loading subcategories...' : '-- Select Subcategory (Optional) --'}
                    </option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-3 sm:mt-4">
              <button
                onClick={handleSaveCategory}
                disabled={categorySaving || !selectedCategoryId}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg font-semibold transition-colors disabled:opacity-60"
              >
                {categorySaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditingCategory(false);
                  // Reset to initial values
                  setSelectedCategoryId(initialCategoryId);
                  setSelectedSubcategoryId(initialSubcategoryId);
                }}
                disabled={categorySaving}
                className="flex-1 border border-gray-300 px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {categoryName ? (
              <div className="flex items-start gap-2 sm:gap-3">
                <Tag01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">Your Default Category</div>
                  <div className="font-semibold text-sm sm:text-base">
                    {/* Show category > subcategory if subcategory exists */}
                    {subcategoryName ? (
                      <>
                        <span>{initialCategoryIcon || '📦'} {categoryName}</span>
                        <span className="text-gray-400 mx-1">&gt;</span>
                        <span>{initialSubcategoryIcon || ''} {subcategoryName}</span>
                      </>
                    ) : (
                      <span>{initialCategoryIcon || '📦'} {categoryName}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-gray-500 italic">
                No default category set. {isOwner && 'Click Edit to set your category for easier ad posting.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Default Location - Using centralized location system */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Location</h2>
          {!isEditingLocation && isOwner && (
            <button
              onClick={() => setIsEditingLocation(true)}
              className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingLocation ? (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Select Your Location
              </label>
              <p className="text-xs text-gray-500 mb-3">
                This will be pre-selected when you post new ads.
              </p>
              <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg p-3">
                <CascadingLocationFilter
                  onLocationSelect={handleLocationSelect}
                  selectedLocationSlug={locationSlug || null}
                  selectedLocationName={locationName || null}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-3 sm:mt-4">
              <button
                onClick={handleSaveLocation}
                disabled={locationSaving}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg font-semibold transition-colors disabled:opacity-60"
              >
                {locationSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditingLocation(false);
                  setLocationSlug(initialLocationSlug || '');
                  setLocationName(initialLocationName || '');
                  setLocationFullPath(initialLocationFullPath || '');
                }}
                disabled={locationSaving}
                className="flex-1 border border-gray-300 px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {locationName ? (
              <div className="flex items-start gap-2 sm:gap-3">
                <MarkerPin02 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-teal-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">Your Location</div>
                  <div className="font-semibold text-sm sm:text-base">
                    {/* Show full path if available, otherwise just the location name */}
                    {locationFullPath || locationName}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-gray-500 italic">
                No default location set. {isOwner && 'Click Edit to set your location for easier ad posting.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Report Shop Button - Only show for non-owners */}
      {!isOwner && (
        <div className="card flex justify-center">
          <ReportShopButton
            shopId={shopId}
            shopName={shopName}
            lang={lang}
          />
        </div>
      )}
    </div>
  );
}
