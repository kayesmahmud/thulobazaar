'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import { messagingApi } from '@/lib/messaging';
import { useToast } from '@/components/ui';
import { useBackendToken } from '@/hooks/useBackendToken';
import { useMessages } from '@/hooks/useSocket';
import type { Ad, DashboardStats, VerificationStatus, AdTab } from '../types';

const DEFAULT_STATS: DashboardStats = {
  totalAds: 0,
  activeAds: 0,
  totalViews: 0,
  totalMessages: 0,
};

export function useDashboardData() {
  const { data: session, status, update: updateSession } = useSession();
  const { success, error: showError } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<AdTab>('active');
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitType, setResubmitType] = useState<'individual' | 'business' | null>(null);

  // Track if session has been refreshed to prevent infinite loops
  const sessionRefreshed = useRef(false);

  // Get backend token for Socket.IO connection
  const { backendToken, loading: tokenLoading } = useBackendToken();

  // Connect to Socket.IO for real-time message notifications (only when token is ready)
  const { socket } = useMessages(tokenLoading ? null : backendToken);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Get backend token
      const token = backendToken || (session as any)?.backendToken;

      // Fetch user ads, verification status, and message count in parallel
      console.log('📨 [Dashboard] Fetching unread count with token:', token ? 'Present' : 'NULL');
      const [adsResponse, verificationResponse, messagesResponse] = await Promise.all([
        apiClient.getUserAds(),
        apiClient.getVerificationStatus().catch(() => ({ success: false, data: null })),
        token
          ? messagingApi.getUnreadCount(token).catch((err) => {
              console.error('📨 [Dashboard] getUnreadCount error:', err);
              return { data: { unreadCount: 0 } };
            })
          : Promise.resolve({ data: { unreadCount: 0 } }),
      ]);
      console.log('📨 [Dashboard] Messages response:', messagesResponse);

      // Get unread message count
      const unreadCount =
        messagesResponse?.data?.unreadCount || messagesResponse?.data?.unread_messages || 0;
      console.log('📨 [Dashboard] Unread count:', unreadCount);

      if (adsResponse.success && adsResponse.data) {
        const ads = adsResponse.data as any[];
        setUserAds(ads as Ad[]);

        // Calculate stats
        const totalViews = ads.reduce((sum, ad: any) => sum + (ad.views || 0), 0);
        const activeAds = ads.filter((ad: any) => ad.status === 'active').length;

        setStats({
          totalAds: ads.length,
          activeAds,
          totalViews,
          totalMessages: unreadCount,
        });
      } else {
        // Even if ads fail, still update message count
        setStats((prev) => ({
          ...prev,
          totalMessages: unreadCount,
        }));
      }

      if (verificationResponse.success && verificationResponse.data) {
        console.log('🔍 Verification Response:', verificationResponse.data);
        setVerificationStatus(verificationResponse.data as VerificationStatus);

        // Refresh session to get updated shop_slug and verification status (only once)
        const data = verificationResponse.data as any;
        if (
          !sessionRefreshed.current &&
          (data.businessVerification?.verified || data.individualVerification?.verified)
        ) {
          console.log('🔄 User is verified, refreshing session to update shop slug...');
          sessionRefreshed.current = true;
          await updateSession();
        }
      }
    } catch (err: any) {
      console.error('Error loading user data:', err);
      setError(err.message || 'Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [backendToken, session, updateSession]);

  // Load data when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      loadUserData();
    }
  }, [status, backendToken, loadUserData]);

  // Listen for new messages via Socket.IO to update count in real-time
  useEffect(() => {
    if (!socket || !backendToken) return;

    const handleNewMessage = async () => {
      try {
        const messagesResponse = await messagingApi.getUnreadCount(backendToken);
        setStats((prevStats) => ({
          ...prevStats,
          totalMessages:
            messagesResponse?.data?.unreadCount || messagesResponse?.data?.unread_messages || 0,
        }));
      } catch (err) {
        console.error('Failed to update message count:', err);
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, backendToken]);

  // Action handlers
  const handleDeleteAd = useCallback(
    async (adId: number) => {
      if (!confirm('Are you sure you want to delete this ad?')) {
        return;
      }

      try {
        await apiClient.deleteAd(adId);
        success('Ad deleted successfully!');
        loadUserData();
      } catch (err: any) {
        showError(err.message || 'Failed to delete ad');
      }
    },
    [loadUserData, success, showError]
  );

  const handleMarkAsSold = useCallback(
    async (adId: number) => {
      if (!confirm('Mark this ad as sold? It will be removed from active listings.')) {
        return;
      }

      try {
        await apiClient.markAdAsSold(adId);
        success('Ad marked as sold successfully!');
        loadUserData();
      } catch (err: any) {
        showError(err.message || 'Failed to mark ad as sold');
      }
    },
    [loadUserData, success, showError]
  );

  const openResubmitModal = useCallback((type: 'individual' | 'business') => {
    setResubmitType(type);
    setShowResubmitModal(true);
  }, []);

  const closeResubmitModal = useCallback(() => {
    setShowResubmitModal(false);
    setResubmitType(null);
  }, []);

  // Filter ads based on active tab
  const filteredAds = userAds.filter((ad) => {
    if (activeTab === 'active') return ad.status === 'active';
    if (activeTab === 'pending') return ad.status === 'pending';
    if (activeTab === 'rejected') return ad.status === 'rejected';
    if (activeTab === 'sold') return ad.status === 'sold';
    return true;
  });

  return {
    // State
    session,
    status,
    activeTab,
    userAds,
    filteredAds,
    loading,
    error,
    stats,
    verificationStatus,
    showResubmitModal,
    resubmitType,

    // Actions
    setActiveTab,
    handleDeleteAd,
    handleMarkAsSold,
    openResubmitModal,
    closeResubmitModal,
    loadUserData,
    success,
  };
}
