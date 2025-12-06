'use client';

import { useState, useEffect } from 'react';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { Phone01, Globe01, MarkerPin01, MarkerPin02 } from '@untitledui-pro/icons/line';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareWhatsapp } from '@fortawesome/free-brands-svg-icons';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';

// Extended user type with backendToken (added by UserAuthContext from NextAuth session)
type UserWithToken = {
  id: number;
  backendToken?: string | null;
};

interface ShopSidebarProps {
  shopId: number;
  shopSlug: string;
  bio: string | null;
  businessDescription: string | null;
  businessPhone: string | null;
  phone: string | null;
  businessWebsite: string | null;
  googleMapsLink: string | null;
  locationName: string | null;
  locationSlug: string | null;
  locationFullPath: string | null;
}

export default function ShopSidebar({
  shopId,
  shopSlug,
  bio,
  businessDescription: initialDescription,
  businessPhone: initialBusinessPhone,
  phone: initialPhone,
  businessWebsite: initialWebsite,
  googleMapsLink: initialGoogleMaps,
  locationName: initialLocationName,
  locationSlug: initialLocationSlug,
  locationFullPath: initialLocationFullPath,
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
    phone: initialPhone || '',
    businessWebsite: initialWebsite || '',
    googleMapsLink: initialGoogleMaps || '',
  });
  const [contactSaving, setContactSaving] = useState(false);

  // Location section states
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationSlug, setLocationSlug] = useState(initialLocationSlug || '');
  const [locationName, setLocationName] = useState(initialLocationName || '');
  const [locationFullPath, setLocationFullPath] = useState(initialLocationFullPath || '');
  const [locationSaving, setLocationSaving] = useState(false);

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

      const response = await fetch(`/api/shop/${shopSlug}/contact`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_phone: contactData.businessPhone,
          phone: contactData.phone,
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

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* About Section */}
      <div className="card">
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
      <div className="card">
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
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={contactData.businessPhone}
                onChange={(e) => setContactData({ ...contactData, businessPhone: e.target.value })}
                placeholder="+977 98XXXXXXXX"
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                value={contactData.phone}
                onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                placeholder="+977 98XXXXXXXX"
                className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
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
                    phone: initialPhone || '',
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
            {contactData.phone && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Phone01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">Mobile</div>
                  <div className="font-semibold text-sm sm:text-base break-all">{contactData.phone}</div>
                </div>
              </div>
            )}
            {contactData.businessWebsite && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Globe01 className="w-5 h-5 sm:w-[30px] sm:h-[30px] text-purple-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-gray-600">Website</div>
                  <a
                    href={contactData.businessWebsite}
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
                    href={contactData.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-500 hover:underline font-semibold text-sm sm:text-base"
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
            )}
            {!contactData.businessPhone && !contactData.phone && !contactData.businessWebsite && !contactData.googleMapsLink && (
              <p className="text-sm sm:text-base text-gray-500 italic">
                No contact information available. {isOwner && 'Click Edit to add your contact details.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Default Location - Using centralized location system */}
      <div className="card">
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
    </div>
  );
}
