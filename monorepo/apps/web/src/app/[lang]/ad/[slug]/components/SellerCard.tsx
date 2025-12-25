import Link from 'next/link';
import Image from 'next/image';
import AdActions from '../AdActions';
import ReportAdButton from '../ReportAdButton';
import SendMessageButton from '@/components/messages/SendMessageButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { MaskedPhoneButton } from './MaskedPhoneButton';
import type { SellerCardProps } from './types';

export function SellerCard({
  seller,
  adId,
  userId,
  adTitle,
  adSlug,
  lang,
}: SellerCardProps) {
  const isVerifiedBusiness = seller?.account_type === 'business' && seller?.business_verification_status === 'approved';
  const isVerifiedIndividual = seller?.account_type === 'individual' &&
    (seller?.individual_verified || seller?.business_verification_status === 'verified');

  const displayName = isVerifiedBusiness && seller?.business_name
    ? seller.business_name
    : seller?.full_name || 'Seller';

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: '1rem'
    }}>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '1rem',
        color: '#1f2937'
      }}>
        Seller Information
      </h3>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <UserAvatar
          src={seller?.avatar}
          name={seller?.full_name}
          size="xl"
          borderColor="none"
        />
        <div style={{ flex: 1 }}>
          {/* Seller/Shop Name with Badge - Clickable */}
          {seller?.shop_slug ? (
            <Link
              href={`/${lang}/shop/${seller.shop_slug}`}
              style={{
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}
            >
              {displayName}
              {isVerifiedBusiness && (
                <Image
                  src="/golden-badge.png"
                  alt="Verified Business"
                  title="Verified Business"
                  width={20}
                  height={20}
                />
              )}
              {isVerifiedIndividual && (
                <Image
                  src="/blue-badge.png"
                  alt="Verified Individual Seller"
                  title="Verified Individual Seller"
                  width={20}
                  height={20}
                />
              )}
            </Link>
          ) : (
            <div style={{
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {seller?.full_name || 'Seller'}
            </div>
          )}
          {/* Verification Status Text */}
          {isVerifiedBusiness && (
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Verified Business Account
            </div>
          )}
          {isVerifiedIndividual && (
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Verified Individual Seller
            </div>
          )}
        </div>
      </div>

      {/* 1. WhatsApp Button */}
      <AdActions
        adId={adId}
        adTitle={adTitle}
        adSlug={adSlug}
        lang={lang}
        whatsappNumber={seller?.business_phone || seller?.phone || null}
        phoneNumber={seller?.phone || null}
        showWhatsAppOnly={true}
      />

      {/* 2. Phone Number Button (masked until clicked) */}
      {seller?.phone && (
        <MaskedPhoneButton phone={seller.phone} />
      )}

      {/* 3. Send Message Button */}
      {userId && (
        <SendMessageButton
          sellerId={userId}
          adId={adId}
          adTitle={adTitle}
          lang={lang}
        />
      )}

      {/* 4. Share and Bookmark actions */}
      <AdActions
        adId={adId}
        adTitle={adTitle}
        adSlug={adSlug}
        lang={lang}
        whatsappNumber={seller?.business_phone || seller?.phone || null}
        phoneNumber={seller?.phone || null}
        showShareFavoriteOnly={true}
      />

      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <ReportAdButton
          adId={adId}
          adTitle={adTitle}
          lang={lang}
        />
      </div>
    </div>
  );
}
