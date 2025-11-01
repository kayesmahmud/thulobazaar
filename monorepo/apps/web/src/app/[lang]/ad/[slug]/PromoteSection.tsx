'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PromoteAdModal from '@/components/PromoteAdModal';
import PromotionBadge from '@/components/PromotionBadge';
import { apiClient } from '@/lib/api';

interface PromoteSectionProps {
  ad: {
    id: number;
    title: string;
    user_id: number;
    is_featured?: boolean;
    featured_until?: Date | string | null;
    is_urgent?: boolean;
    urgent_until?: Date | string | null;
    is_sticky?: boolean;
    sticky_until?: Date | string | null;
  };
}

export default function PromoteSection({ ad }: PromoteSectionProps) {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Only fetch user data if authenticated
    if (status === 'authenticated' && session?.user) {
      checkCurrentUser();
    }
  }, [status, session]);

  const checkCurrentUser = async () => {
    try {
      const response = await apiClient.getMe();
      if (response.success && response.data) {
        setCurrentUser(response.data);
      }
    } catch (error) {
      // User not logged in or API error
      console.log('Failed to fetch user data:', error);
    }
  };

  // Check if current user owns this ad
  const isOwner = currentUser && currentUser.id === ad.user_id;

  // Don't show anything if not authenticated or not the owner
  if (status === 'loading' || status === 'unauthenticated' || !isOwner) {
    return null;
  }

  const now = new Date();
  const hasActivePromotion =
    (ad.is_featured && ad.featured_until && new Date(ad.featured_until) > now) ||
    (ad.is_urgent && ad.urgent_until && new Date(ad.urgent_until) > now) ||
    (ad.is_sticky && ad.sticky_until && new Date(ad.sticky_until) > now);

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        color: 'white'
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🚀</span> Promote Your Ad
        </h3>

        {/* Current Promotion Status */}
        {hasActivePromotion ? (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                Active Promotion:
              </div>
              <PromotionBadge ad={{
                isFeatured: ad.is_featured,
                featuredUntil: ad.featured_until,
                isUrgent: ad.is_urgent,
                urgentUntil: ad.urgent_until,
                isSticky: ad.is_sticky,
                stickyUntil: ad.sticky_until
              }} size="medium" />

              {/* Show expiry date */}
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                {ad.is_featured && ad.featured_until && new Date(ad.featured_until) > now && (
                  <div>Expires: {new Date(ad.featured_until).toLocaleDateString()}</div>
                )}
                {ad.is_urgent && ad.urgent_until && new Date(ad.urgent_until) > now && (
                  <div>Expires: {new Date(ad.urgent_until).toLocaleDateString()}</div>
                )}
                {ad.is_sticky && ad.sticky_until && new Date(ad.sticky_until) > now && (
                  <div>Expires: {new Date(ad.sticky_until).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p style={{
            fontSize: '0.875rem',
            marginBottom: '1rem',
            opacity: 0.95,
            lineHeight: '1.5'
          }}>
            Boost your ad visibility with our promotion packages!
          </p>
        )}

        {/* Promote Button */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          {hasActivePromotion ? '✨ Extend or Change Promotion' : '🚀 Promote Now'}
        </button>

        {/* Benefits */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', opacity: 0.9 }}>
            Benefits:
          </div>
          <ul style={{
            fontSize: '0.75rem',
            lineHeight: '1.6',
            paddingLeft: '1.25rem',
            opacity: 0.9
          }}>
            <li>⭐ Featured - Maximum visibility</li>
            <li>🔥 Urgent - Priority placement</li>
            <li>📌 Sticky - Stay on top</li>
          </ul>
        </div>
      </div>

      {/* Promote Modal */}
      {showModal && (
        <PromoteAdModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          ad={{
            id: ad.id,
            title: ad.title,
            isFeatured: ad.is_featured,
            isUrgent: ad.is_urgent,
            isSticky: ad.is_sticky
          }}
          onPromote={() => {
            setShowModal(false);
            // Refresh the page to show updated promotion status
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
