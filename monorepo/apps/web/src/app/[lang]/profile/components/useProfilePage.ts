'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useProfileData } from '@/hooks/useProfileData';
import type { TabType } from '@/components/profile';
import type { FavoriteAd, ProfileFormData } from './types';

export function useProfilePage(lang: string) {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const { profile, loading: profileLoading, error: profileError, refreshProfile } = useProfileData({
    enabled: status === 'authenticated',
  });

  const [locationsLoading, setLocationsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    locationId: '',
  });

  const [favorites, setFavorites] = useState<FavoriteAd[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);

  const isLoading = status === 'loading' || profileLoading || locationsLoading;

  const displayName = useMemo(() => {
    if (!profile) return '';
    const businessVerified =
      profile.businessVerificationStatus === 'approved' ||
      profile.businessVerificationStatus === 'verified';
    if (businessVerified && profile.businessName) {
      return profile.businessName;
    }
    if (profile.individualVerified && profile.verifiedSellerName) {
      return profile.verifiedSellerName;
    }
    return profile.fullName || '';
  }, [profile]);

  const fallbackShopSlug = useMemo(() => {
    if (!profile) return '';
    const baseName = (profile.businessName || displayName || 'shop')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-');
    return `${baseName}-${profile.id}`;
  }, [profile, displayName]);

  const activeShopSlug = profile?.customShopSlug || fallbackShopSlug;

  const isVerifiedBusiness =
    profile?.businessVerificationStatus === 'approved' ||
    profile?.businessVerificationStatus === 'verified';
  const isVerified = profile?.individualVerified || isVerifiedBusiness;
  const isNameLocked =
    profile?.individualVerified ||
    profile?.businessVerificationStatus === 'approved' ||
    profile?.businessVerificationStatus === 'verified';

  const fetchLocations = useCallback(async () => {
    try {
      setLocationsLoading(true);
      await apiClient.getLocations({ type: 'municipality' });
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      setFavoritesLoading(true);
      const response = await fetch('/api/favorites', { credentials: 'include' });
      const data = await response.json();
      if (data.success && data.data) {
        setFavorites(data.data);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  const removeFavorite = async (adId: number) => {
    try {
      const response = await fetch(`/api/favorites/${adId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setFavorites((prev) => prev.filter((f) => f.adId !== adId));
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
    }
  }, [status, router, lang]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLocations();
      fetchFavorites();
    }
  }, [status, fetchLocations, fetchFavorites]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: displayName,
        locationId: profile.locationId ? String(profile.locationId) : '',
      });
    }
  }, [profile, displayName]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await apiClient.updateProfile({ fullName: formData.name });

      if (response.success && response.data) {
        const updatedUser = response.data;

        setFormData({
          name: updatedUser.fullName || formData.name,
          locationId: updatedUser.locationId ? String(updatedUser.locationId) : formData.locationId,
        });

        setUnsavedChanges(false);
        setSuccessMessage('Profile updated successfully!');
        await refreshProfile();

        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedUser.fullName,
            phone: updatedUser.phone,
          },
        });

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySuccess = async () => {
    await refreshProfile();
    await update();
  };

  const handleShopSuccess = async () => {
    await refreshProfile();
    await update();
  };

  const clearError = () => setError('');

  return {
    profile,
    profileError,
    isLoading,
    saving,
    error,
    successMessage,
    unsavedChanges,
    activeTab,
    setActiveTab,
    formData,
    favorites,
    favoritesLoading,
    displayName,
    fallbackShopSlug,
    activeShopSlug,
    isVerified,
    isVerifiedBusiness,
    isNameLocked,
    handleInputChange,
    handleSubmit,
    handleSecuritySuccess,
    handleShopSuccess,
    removeFavorite,
    clearError,
  };
}
