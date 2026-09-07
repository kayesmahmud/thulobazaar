import Link from 'next/link';
import Image from 'next/image';
import AdActions from '../AdActions';
import SendMessageButton from '@/components/messages/SendMessageButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { MaskedPhoneButton } from './MaskedPhoneButton';
import { OwnerGuard } from './OwnerGuard';
import { getTranslations } from 'next-intl/server';
import type { SellerCardProps } from './types';

export async function SellerCard({
  seller,
  adId,
  userId,
  adTitle,
  adSlug,
  lang,
  favoritesCount = 0,
  whatsappNumber = null,
}: SellerCardProps) {
  const t = await getTranslations('ads');

  const isVerifiedBusiness = seller?.account_type === 'business' && (seller?.business_verification_status === 'approved' || seller?.business_verification_status === 'verified');
  const isVerifiedIndividual = seller?.account_type === 'individual' &&
    (seller?.individual_verified || seller?.business_verification_status === 'approved' || seller?.business_verification_status === 'verified');

  const displayName = isVerifiedBusiness && seller?.business_name
    ? seller.business_name
    : seller?.full_name || t('seller');

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
        {t('sellerInformation')}
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
                  alt={t('verifiedBusiness')}
                  title={t('verifiedBusiness')}
                  width={20}
                  height={20}
                />
              )}
              {isVerifiedIndividual && (
                <Image
                  src="/blue-badge.png"
                  alt={t('verifiedIndividualSeller')}
                  title={t('verifiedIndividualSeller')}
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
              {seller?.full_name || t('seller')}
            </div>
          )}
          {/* Verification Status Text */}
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {isVerifiedBusiness
              ? t('verifiedBusinessAccount')
              : isVerifiedIndividual
              ? t('verifiedIndividualSeller')
              : t('seller')}
          </div>
        </div>
      </div>

      {/* Contact buttons — disabled when viewing own ad */}
      <OwnerGuard sellerId={userId} showLabel>
        {/* 1. WhatsApp Button */}
        <AdActions
          adId={adId}
          adTitle={adTitle}
          adSlug={adSlug}
          lang={lang}
          whatsappNumber={whatsappNumber || seller?.business_phone || seller?.phone || null}
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
      </OwnerGuard>

      {/* 4. Share and Bookmark actions (always active — owners can share/bookmark too) */}
      <AdActions
        adId={adId}
        adTitle={adTitle}
        adSlug={adSlug}
        lang={lang}
        whatsappNumber={seller?.business_phone || seller?.phone || null}
        phoneNumber={seller?.phone || null}
        showShareFavoriteOnly={true}
        initialFavoritesCount={favoritesCount}
      />
    </div>
  );
}
