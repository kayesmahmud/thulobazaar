'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';
import { apiClient } from '@/lib/api';
import IndividualVerificationForm from '@/components/IndividualVerificationForm';
import BusinessVerificationForm from '@/components/BusinessVerificationForm';

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
        setUserAds(ads);

        // Calculate stats
        const totalViews = ads.reduce((sum, ad) => sum + (ad.views || 0), 0);
        const activeAds = ads.filter(ad => ad.status === 'active').length;

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
      // Reload data after deletion
      loadUserData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete ad');
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
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Loading your dashboard...</p>
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
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <Link href={`/${lang}`} style={{ color: '#667eea', textDecoration: 'none' }}>
              Home
            </Link>
            <span>/</span>
            <span>Dashboard</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
              My Dashboard
            </h1>
            <p style={{ color: '#6b7280' }}>Welcome back, {session?.user?.name}!</p>
          </div>
          <Link
            href={`/${lang}/post-ad`}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            + POST FREE AD
          </Link>
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

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}>
              {stats.totalAds}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Ads</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981', marginBottom: '0.25rem' }}>
              {stats.activeAds}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Active Ads</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👁️</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#667eea', marginBottom: '0.25rem' }}>
              {stats.totalViews}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Views</div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.25rem' }}>
              {stats.totalMessages}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Messages</div>
          </div>
        </div>

        {/* Verification Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Account Verification
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem',
            fontSize: '0.95rem'
          }}>
            Get verified to build trust with buyers and unlock premium features
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
          }}>
            {/* Individual Verification Card */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              background: verificationStatus?.individual?.status === 'verified' ? '#f0fdf4' : '#fff'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '2rem' }}>
                  {verificationStatus?.individual?.status === 'verified' ? '✅' : '👤'}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.25rem'
                  }}>
                    Individual Verification
                  </h3>
                  <div style={{
                    fontSize: '0.875rem',
                    color: verificationStatus?.individual?.status === 'verified' ? '#166534' :
                           verificationStatus?.individual?.status === 'pending' ? '#f59e0b' :
                           verificationStatus?.individual?.status === 'rejected' ? '#dc2626' : '#6b7280'
                  }}>
                    Status: {verificationStatus?.individual?.status === 'verified' ? 'Verified' :
                             verificationStatus?.individual?.status === 'pending' ? 'Pending Review' :
                             verificationStatus?.individual?.status === 'rejected' ? 'Rejected' : 'Not Verified'}
                  </div>
                </div>
              </div>

              {verificationStatus?.individual?.status === 'rejected' && verificationStatus.individual.rejectionReason && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  Reason: {verificationStatus.individual.rejectionReason}
                </div>
              )}

              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '1rem',
                lineHeight: '1.5'
              }}>
                Verify your identity with a government-issued ID to build trust with buyers
              </p>

              {(!verificationStatus?.individual || verificationStatus.individual.status === 'unverified' || verificationStatus.individual.status === 'rejected') && (
                <button
                  onClick={() => setShowIndividualVerificationModal(true)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  {verificationStatus?.individual?.status === 'rejected' ? 'Reapply' : 'Get Verified'}
                </button>
              )}

              {verificationStatus?.individual?.status === 'pending' && (
                <div style={{
                  padding: '0.75rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#92400e'
                }}>
                  ⏳ Your verification is under review
                </div>
              )}
            </div>

            {/* Business Verification Card */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              background: verificationStatus?.business?.status === 'verified' ? '#f0fdf4' : '#fff'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '2rem' }}>
                  {verificationStatus?.business?.status === 'verified' ? '✅' : '🏢'}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.25rem'
                  }}>
                    Business Verification
                  </h3>
                  <div style={{
                    fontSize: '0.875rem',
                    color: verificationStatus?.business?.status === 'verified' ? '#166534' :
                           verificationStatus?.business?.status === 'pending' ? '#f59e0b' :
                           verificationStatus?.business?.status === 'rejected' ? '#dc2626' : '#6b7280'
                  }}>
                    Status: {verificationStatus?.business?.status === 'verified' ? 'Verified' :
                             verificationStatus?.business?.status === 'pending' ? 'Pending Review' :
                             verificationStatus?.business?.status === 'rejected' ? 'Rejected' : 'Not Verified'}
                  </div>
                </div>
              </div>

              {verificationStatus?.business?.status === 'rejected' && verificationStatus.business.rejectionReason && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  Reason: {verificationStatus.business.rejectionReason}
                </div>
              )}

              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '1rem',
                lineHeight: '1.5'
              }}>
                Verify your business with registration documents to access business features
              </p>

              {(!verificationStatus?.business || verificationStatus.business.status === 'unverified' || verificationStatus.business.status === 'rejected') && (
                <button
                  onClick={() => setShowBusinessVerificationModal(true)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  {verificationStatus?.business?.status === 'rejected' ? 'Reapply' : 'Get Verified'}
                </button>
              )}

              {verificationStatus?.business?.status === 'pending' && (
                <div style={{
                  padding: '0.75rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#92400e'
                }}>
                  ⏳ Your verification is under review
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ads List */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'active' ? '2px solid #667eea' : '2px solid transparent',
                color: activeTab === 'active' ? '#667eea' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Active ({userAds.filter(ad => ad.status === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'pending' ? '2px solid #667eea' : '2px solid transparent',
                color: activeTab === 'pending' ? '#667eea' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Pending ({userAds.filter(ad => ad.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'sold' ? '2px solid #667eea' : '2px solid transparent',
                color: activeTab === 'sold' ? '#667eea' : '#6b7280',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Sold ({userAds.filter(ad => ad.status === 'sold').length})
            </button>
          </div>

          {/* Ads Table */}
          {filteredAds.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
              <p>No {activeTab} ads</p>
              <Link
                href={`/${lang}/post-ad`}
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Post Your First Ad
              </Link>
            </div>
          ) : (
            <div>
              {filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderBottom: '1px solid #f3f4f6',
                    gap: '1rem'
                  }}
                >
                  {/* Thumbnail Image */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#f3f4f6',
                    flexShrink: 0
                  }}>
                    {ad.images && ad.images.length > 0 ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${ad.images[0].file_path || ad.images[0].filename}`}
                        alt={ad.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem'
                      }}>
                        📷
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <Link
                      href={`/${lang}/ad/${ad.slug}`}
                      style={{
                        color: '#1f2937',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '1.05rem'
                      }}
                    >
                      {ad.title}
                    </Link>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginTop: '0.25rem'
                    }}>
                      Posted {formatDateTime(new Date(ad.created_at))} • {ad.views || 0} views
                    </div>
                  </div>

                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: '#10b981'
                  }}>
                    {formatPrice(ad.price)}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/${lang}/edit-ad/${ad.id}`}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
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
