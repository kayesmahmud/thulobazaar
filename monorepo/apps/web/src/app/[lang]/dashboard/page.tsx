'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';
import { apiClient } from '@/lib/api';
import { messagingApi } from '@/lib/messagingApi';
import { useToast } from '@/components/Toast';
import { EmptyAds } from '@/components/EmptyState';
import { StatusBadge } from '@/components/ui';
import { useBackendToken } from '@/hooks/useBackendToken';
import { useMessages } from '@/hooks/useSocket';

interface DashboardPageProps {
  params: Promise<{ lang: string }>;
}

interface Ad {
  id: number;
  title: string;
  slug: string;
  price: number;
  status: string;
  views: number;
  created_at: string;
}

interface DashboardStats {
  totalAds: number;
  activeAds: number;
  totalViews: number;
  totalMessages: number;
}

interface VerificationStatus {
  business?: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    rejectionReason?: string;
  };
  individual?: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    rejectionReason?: string;
  };
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { lang } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'sold'>('active');
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalAds: 0,
    activeAds: 0,
    totalViews: 0,
    totalMessages: 0
  });

  // Verification state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);

  // Get backend token for Socket.IO connection
  const { backendToken, loading: tokenLoading } = useBackendToken();

  // Connect to Socket.IO for real-time message notifications (only when token is ready)
  const { socket } = useMessages(tokenLoading ? null : backendToken);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }

    // Load data when authenticated
    if (status === 'authenticated') {
      loadUserData();
    }
  }, [status, router, lang]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get backend token
      const token = backendToken || (session as any)?.backendToken;

      // Fetch user ads, verification status, and message count in parallel
      const [adsResponse, verificationResponse, messagesResponse] = await Promise.all([
        apiClient.getUserAds(),
        apiClient.getVerificationStatus().catch(() => ({ success: false, data: null })),
        token ? messagingApi.getUnreadCount(token).catch(() => ({ data: { unreadCount: 0 } })) : Promise.resolve({ data: { unreadCount: 0 } }),
      ]);

      if (adsResponse.success && adsResponse.data) {
        const ads = adsResponse.data;
        setUserAds(ads as any);

        // Calculate stats
        const totalViews = ads.reduce((sum, ad: any) => sum + (ad.views || 0), 0);
        const activeAds = ads.filter((ad: any) => ad.status === 'active').length;

        setStats({
          totalAds: ads.length,
          activeAds,
          totalViews,
          totalMessages: messagesResponse?.data?.unread_messages || 0
        });
      }

      if (verificationResponse.success && verificationResponse.data) {
        setVerificationStatus(verificationResponse.data);
      }
    } catch (err: any) {
      console.error('Error loading user data:', err);
      setError(err.message || 'Failed to load your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Listen for new messages via Socket.IO to update count in real-time
  useEffect(() => {
    if (!socket || !backendToken) return;

    const handleNewMessage = async () => {
      // Fetch updated unread count
      try {
        const messagesResponse = await messagingApi.getUnreadCount(backendToken);
        setStats((prevStats) => ({
          ...prevStats,
          totalMessages: messagesResponse?.data?.unread_messages || 0
        }));
      } catch (err) {
        console.error('Failed to update message count:', err);
      }
    };

    // Listen for new messages
    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, backendToken]);


  const handleDeleteAd = async (adId: number) => {
    if (!confirm('Are you sure you want to delete this ad?')) {
      return;
    }

    try {
      await apiClient.deleteAd(adId);
      success('Ad deleted successfully!');
      // Reload data after deletion
      loadUserData();
    } catch (err: any) {
      showError(err.message || 'Failed to delete ad');
    }
  };

  // Filter ads based on active tab
  const filteredAds = userAds.filter(ad => {
    if (activeTab === 'active') return ad.status === 'active';
    if (activeTab === 'pending') return ad.status === 'pending';
    if (activeTab === 'sold') return ad.status === 'sold';
    return true;
  });

  // Show loading state while checking authentication
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            {/* Animated Loading Circle */}
            <div className="w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
              <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Dashboard</h2>
          <p className="text-white/80">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
          {/* Breadcrumb */}
          <div className="flex gap-2 text-sm text-white/80 mb-6">
            <Link href={`/${lang}`} className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white font-medium">Dashboard</span>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90">
                My Dashboard
              </h1>
              <p className="text-xl text-white/90">
                Welcome back, <span className="font-semibold">{session?.user?.name}</span>! 👋
              </p>
            </div>
            <Link
              href={`/${lang}/post-ad`}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-10 py-5 rounded-2xl font-black text-lg hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-2xl hover:shadow-green-500/50 hover:scale-110 animate-pulse"
            >
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>

              {/* Button Content */}
              <div className="relative flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="tracking-wide">POST FREE AD</span>
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border-2 border-red-300 text-red-700 p-4 rounded-2xl shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Stats Cards - Floating Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 -mt-8 mb-12 relative z-20">
          {/* Total Ads Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stats.totalAds}
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Ads</div>
            <div className="mt-2 text-xs text-gray-500">All your listings</div>
          </div>

          {/* Active Ads Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {stats.activeAds}
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Ads</div>
            <div className="mt-2 text-xs text-gray-500">Currently live</div>
          </div>

          {/* Total Views Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {stats.totalViews}
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Views</div>
            <div className="mt-2 text-xs text-gray-500">People interested</div>
          </div>

          {/* Messages Card */}
          <Link href={`/${lang}/messages`} className="block">
            <div className="group bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-right flex flex-col items-center">
                  {stats.totalMessages > 0 ? (
                    <>
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-lg font-bold text-white">{stats.totalMessages}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500">
                        {stats.totalMessages === 1 ? 'unread message' : 'unread messages'}
                      </p>
                    </>
                  ) : (
                    <div className="text-4xl font-bold text-gray-300">0</div>
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Messages</div>
              <div className="mt-2 text-xs text-gray-500">From buyers</div>
            </div>
          </Link>
        </div>

        {/* Verification Section - Enhanced Design */}
        <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 mb-12 shadow-2xl text-white overflow-hidden group hover:shadow-3xl transition-shadow duration-300">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300 rounded-full blur-3xl transform -translate-x-32 translate-y-32"></div>
          </div>

          <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold">Get Verified & Stand Out</h2>
              </div>
              <p className="text-white/90 mb-5 text-lg leading-relaxed">
                Build trust with buyers, unlock premium features, and boost your visibility
              </p>
              <div className="flex flex-wrap gap-3">
                {verificationStatus?.individual?.status === 'verified' && (
                  <div className="flex items-center gap-2 bg-white/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/40 shadow-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Individual Verified</span>
                  </div>
                )}
                {verificationStatus?.business?.status === 'verified' && (
                  <div className="flex items-center gap-2 bg-white/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/40 shadow-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Business Verified</span>
                  </div>
                )}
                {verificationStatus?.individual?.status === 'rejected' && (
                  <div className="flex items-center gap-2 bg-red-500/90 px-4 py-2 rounded-full backdrop-blur-sm border border-red-400 shadow-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Individual Rejected - Reapply</span>
                  </div>
                )}
                {verificationStatus?.business?.status === 'rejected' && (
                  <div className="flex items-center gap-2 bg-red-500/90 px-4 py-2 rounded-full backdrop-blur-sm border border-red-400 shadow-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Business Rejected - Reapply</span>
                  </div>
                )}
                {(!verificationStatus?.individual || verificationStatus.individual.status === 'unverified') &&
                 (!verificationStatus?.business || verificationStatus.business.status === 'unverified') && (
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/30">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    <span className="font-medium">Not Verified Yet</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Link
                href="verification"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-purple-600 font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
              >
                {(verificationStatus?.individual?.status === 'rejected' || verificationStatus?.business?.status === 'rejected') ? (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Manage Verifications
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Get Verified Now
                  </>
                )}
              </Link>
            </div>
          </div>
        </div>


        {/* Ads List - Modern Design */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header Section */}
          <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">My Listings</h2>
                <p className="text-gray-600">Manage and track all your advertisements</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">{userAds.length} Total Ads</span>
              </div>
            </div>

            {/* Modern Tabs */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('active')}
                className={`group relative px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-300 ${
                  activeTab === 'active'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Active ({userAds.filter(ad => ad.status === 'active').length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`group relative px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-300 ${
                  activeTab === 'pending'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending ({userAds.filter(ad => ad.status === 'pending').length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('sold')}
                className={`group relative px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-300 ${
                  activeTab === 'sold'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sold ({userAds.filter(ad => ad.status === 'sold').length})
                </span>
              </button>
            </div>
          </div>

          {/* Ads Grid */}
          <div className="p-6">
            {filteredAds.length === 0 ? (
              <EmptyAds lang={lang} />
            ) : (
              <div className="space-y-4">
                {filteredAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="group flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-full md:w-28 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 relative shadow-md group-hover:shadow-xl transition-shadow duration-300">
                      {(ad as any).images && (ad as any).images.length > 0 ? (
                        <Image
                          src={`/${(ad as any).images[0].filePath || (ad as any).images[0].filename}`}
                          alt={ad.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="112px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Ad Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${lang}/ad/${ad.slug}`}
                        className="text-gray-900 no-underline font-bold text-lg hover:text-indigo-600 transition-colors line-clamp-2 block mb-2"
                      >
                        {ad.title}
                      </Link>
                      <div className="flex items-center gap-3 flex-wrap">
                        <StatusBadge status={ad.status} size="sm" showIcon />
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDateTime(new Date(ad.created_at))}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{ad.views || 0} views</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Price</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {formatPrice(ad.price)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/${lang}/ad/${ad.slug}`}
                          className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl no-underline text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Link>
                        <div className="flex gap-2">
                          <Link
                            href={`/${lang}/edit-ad/${ad.id}`}
                            className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg no-underline text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-red-50 text-red-600 border-none rounded-lg cursor-pointer text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
