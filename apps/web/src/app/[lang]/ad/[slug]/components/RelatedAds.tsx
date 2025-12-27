import { AdCard } from '@/components/ads';

export interface RelatedAd {
  id: number;
  title: string;
  price: number;
  primaryImage: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  publishedAt: Date;
  sellerName: string;
  isFeatured: boolean;
  isUrgent: boolean;
  isSticky: boolean;
  condition: string | null;
  slug: string | null;
  accountType: string | null;
  businessVerificationStatus: string | null;
  individualVerified: boolean;
}

interface RelatedAdsProps {
  ads: RelatedAd[];
  lang: string;
}

export function RelatedAds({ ads, lang }: RelatedAdsProps) {
  if (ads.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Related Ads
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <AdCard
            key={ad.id}
            lang={lang}
            ad={{
              id: ad.id,
              title: ad.title,
              price: ad.price,
              primaryImage: ad.primaryImage,
              categoryName: ad.categoryName,
              categoryIcon: ad.categoryIcon,
              publishedAt: ad.publishedAt,
              sellerName: ad.sellerName,
              isFeatured: ad.isFeatured,
              isUrgent: ad.isUrgent,
              isSticky: ad.isSticky,
              condition: ad.condition,
              slug: ad.slug || undefined,
              accountType: ad.accountType || undefined,
              businessVerificationStatus: ad.businessVerificationStatus || undefined,
              individualVerified: ad.individualVerified,
            }}
          />
        ))}
      </div>
    </div>
  );
}
