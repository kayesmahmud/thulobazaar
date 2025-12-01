'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export interface ProfileData {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  locationId?: number | null;
  individualVerified: boolean;
  businessVerificationStatus?: string | null;
  businessName?: string | null;
  verifiedSellerName?: string | null;
  accountType?: string | null;
  customShopSlug?: string | null;
  createdAt?: string | Date;
}

interface UseProfileDataOptions {
  enabled?: boolean;
}

/**
 * Shared hook to load the authenticated user's profile.
 * Ensures consistent data transformation and avoids duplicate fetch logic.
 */
export function useProfileData(options: UseProfileDataOptions = {}) {
  const { enabled = true } = options;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(enabled));
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getMe();
      if (response.success && response.data) {
        setProfile(response.data as ProfileData);
      } else {
        setError((response as any).message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [enabled, refreshProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
  };
}
