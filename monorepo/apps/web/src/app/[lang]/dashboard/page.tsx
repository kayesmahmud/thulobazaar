'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';
import { apiClient } from '@/lib/api';
import IndividualVerificationForm from '@/components/IndividualVerificationForm';
import BusinessVerificationForm from '@/components/BusinessVerificationForm';
import { useToast } from '@/components/Toast';
import { EmptyAds } from '@/components/EmptyState';
import { Button, StatusBadge } from '@/components/ui';

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
  const [showBusinessVerificationModal, setShowBusinessVerificationModal] = useState(false);
  const [showIndividualVerificationModal, setShowIndividualVerificationModal] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/login`);
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

      // Fetch user ads and verification status in parallel
      const [adsResponse, verificationResponse] = await Promise.all([
        apiClient.getUserAds(),
        apiClient.getVerificationStatus().catch(() => ({ success: false, data: null })),
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
          totalMessages: 0 // TODO: Fetch from messages API
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

  const handleBusinessVerificationSuccess = async () => {
    // Close the modal
    setShowBusinessVerificationModal(false);

    // Reload verification status
    try {
      const verificationResponse = await apiClient.getVerificationStatus();
      if (verificationResponse.success && verificationResponse.data) {
        setVerificationStatus(verificationResponse.data);
      }
    } catch (err) {
      console.error('Failed to reload verification status:', err);
    }
  };

  const handleIndividualVerificationSuccess = async () => {
    // Close the modal
    setShowIndividualVerificationModal(false);

    // Reload verification status
    try {
      const verificationResponse = await apiClient.getVerificationStatus();
      if (verificationResponse.success && verificationResponse.data) {
        setVerificationStatus(verificationResponse.data);
      }
    } catch (err) {
      console.error('Failed to reload verification status:', err);
    }
  };

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-screen-desktop mx-auto px-4">
          <div className="flex gap-2 text-sm text-gray-500">
            <Link href={`/${lang}`} className="text-indigo-500 hover:text-indigo-600">
              Home
            </Link>
            <span>/</span>
            <span>Dashboard</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-desktop mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              My Dashboard
            </h1>
            <p className="text-gray-500">Welcome back, {session?.user?.name}!</p>
          </div>
          <Link
            href={`/${lang}/post-ad`}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            + POST FREE AD
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {stats.totalAds}
            </div>
            <div className="text-sm text-gray-500">Total Ads</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-3xl font-bold text-green-500 mb-1">
              {stats.activeAds}
            </div>
            <div className="text-sm text-gray-500">Active Ads</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">👁️</div>
            <div className="text-3xl font-bold text-indigo-500 mb-1">
              {stats.totalViews}
            </div>
            <div className="text-sm text-gray-500">Total Views</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-3xl font-bold text-amber-500 mb-1">
              {stats.totalMessages}
            </div>
            <div className="text-sm text-gray-500">Messages</div>
          </div>
        </div>

        {/* Verification Section */}
        <div className="bg-white rounded-xl p-8 mb-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Account Verification
          </h2>
          <p className="text-gray-500 mb-6 text-[0.95rem]">
            Get verified to build trust with buyers and unlock premium features
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Individual Verification Card */}
            <div className={`border border-gray-200 rounded-xl p-6 ${
              verificationStatus?.individual?.status === 'verified' ? 'bg-green-50' : 'bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">
                  {verificationStatus?.individual?.status === 'verified' ? '✅' : '👤'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    Individual Verification
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <StatusBadge
                      status={verificationStatus?.individual?.status || 'unverified'}
                      size="sm"
                      showIcon
                    />
                  </div>
                </div>
              </div>

              {verificationStatus?.individual?.status === 'rejected' && verificationStatus.individual.rejectionReason && (
                <div className="bg-red-50 border border-red-300 text-red-600 p-3 rounded-md text-sm mb-4">
                  Reason: {verificationStatus.individual.rejectionReason}
                </div>
              )}

              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Verify your identity with a government-issued ID to build trust with buyers
              </p>

              {(!verificationStatus?.individual || verificationStatus.individual.status === 'unverified' || verificationStatus.individual.status === 'rejected') && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setShowIndividualVerificationModal(true)}
                >
                  {verificationStatus?.individual?.status === 'rejected' ? 'Reapply' : 'Get Verified'}
                </Button>
              )}

              {verificationStatus?.individual?.status === 'pending' && (
                <div className="py-3 bg-amber-50 border border-amber-300 rounded-lg text-center text-sm text-amber-800">
                  ⏳ Your verification is under review
                </div>
              )}
            </div>

            {/* Business Verification Card */}
            <div className={`border border-gray-200 rounded-xl p-6 ${
              verificationStatus?.business?.status === 'verified' ? 'bg-green-50' : 'bg-white'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">
                  {verificationStatus?.business?.status === 'verified' ? '✅' : '🏢'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    Business Verification
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <StatusBadge
                      status={verificationStatus?.business?.status || 'unverified'}
                      size="sm"
                      showIcon
                    />
                  </div>
                </div>
              </div>

              {verificationStatus?.business?.status === 'rejected' && verificationStatus.business.rejectionReason && (
                <div className="bg-red-50 border border-red-300 text-red-600 p-3 rounded-md text-sm mb-4">
                  Reason: {verificationStatus.business.rejectionReason}
                </div>
              )}

              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Verify your business with registration documents to access business features
              </p>

              {(!verificationStatus?.business || verificationStatus.business.status === 'unverified' || verificationStatus.business.status === 'rejected') && (
                <Button
                  variant="success"
                  fullWidth
                  onClick={() => setShowBusinessVerificationModal(true)}
                >
                  {verificationStatus?.business?.status === 'rejected' ? 'Reapply' : 'Get Verified'}
                </Button>
              )}

              {verificationStatus?.business?.status === 'pending' && (
                <div className="py-3 bg-amber-50 border border-amber-300 rounded-lg text-center text-sm text-amber-800">
                  ⏳ Your verification is under review
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ads List */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-3 px-6 bg-transparent border-none border-b-2 font-semibold cursor-pointer ${
                activeTab === 'active'
                  ? 'border-indigo-500 text-indigo-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active ({userAds.filter(ad => ad.status === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-3 px-6 bg-transparent border-none border-b-2 font-semibold cursor-pointer ${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({userAds.filter(ad => ad.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`py-3 px-6 bg-transparent border-none border-b-2 font-semibold cursor-pointer ${
                activeTab === 'sold'
                  ? 'border-indigo-500 text-indigo-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sold ({userAds.filter(ad => ad.status === 'sold').length})
            </button>
          </div>

          {/* Ads Table */}
          {filteredAds.length === 0 ? (
            <EmptyAds lang={lang} />
          ) : (
            <div>
              {filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  className="flex justify-between items-center p-4 border-b border-gray-100 gap-4 last:border-b-0"
                >
                  {/* Thumbnail Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    {(ad as any).images && (ad as any).images.length > 0 ? (
                      <Image
                        src={`/${(ad as any).images[0].filePath || (ad as any).images[0].filename}`}
                        alt={ad.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        📷
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <Link
                      href={`/${lang}/ad/${ad.slug}`}
                      className="text-gray-800 no-underline font-semibold text-[1.05rem] hover:text-indigo-500"
                    >
                      {ad.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={ad.status} size="sm" showIcon />
                      <span className="text-sm text-gray-500">
                        Posted {formatDateTime(new Date(ad.created_at))} • {ad.views || 0} views
                      </span>
                    </div>
                  </div>

                  <div className="text-lg font-bold text-green-500">
                    {formatPrice(ad.price)}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/${lang}/ad/${ad.slug}`}
                      className="py-2 px-4 bg-blue-50 text-blue-600 rounded-md no-underline text-sm font-medium hover:bg-blue-100"
                    >
                      View
                    </Link>
                    <Link
                      href={`/${lang}/edit-ad/${ad.id}`}
                      className="py-2 px-4 bg-gray-100 text-gray-700 rounded-md no-underline text-sm font-medium hover:bg-gray-200"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      className="py-2 px-4 bg-red-50 text-red-600 border-none rounded-md cursor-pointer text-sm font-medium hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business Verification Modal */}
        {showBusinessVerificationModal && (
          <BusinessVerificationForm
            onSuccess={handleBusinessVerificationSuccess}
            onCancel={() => setShowBusinessVerificationModal(false)}
          />
        )}

        {/* Individual Verification Modal */}
        {showIndividualVerificationModal && (
          <IndividualVerificationForm
            onSuccess={handleIndividualVerificationSuccess}
            onCancel={() => setShowIndividualVerificationModal(false)}
          />
        )}
      </div>
    </div>
  );
}
