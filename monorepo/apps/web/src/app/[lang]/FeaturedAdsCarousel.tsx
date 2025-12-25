'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Link from 'next/link';
import { getImageUrl } from '@/lib/images/imageUrl';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface FeaturedAd {
  id: number;
  title: string;
  price: number;
  primaryImage: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  locationName: string | null;
  slug?: string;
  condition: string | null;
  publishedAt?: string | Date;
  sellerName?: string;
  accountType?: string;
  businessVerificationStatus?: string;
  individualVerified?: boolean;
}

interface FeaturedAdsCarouselProps {
  ads: FeaturedAd[];
  lang: string;
}

export default function FeaturedAdsCarousel({ ads, lang }: FeaturedAdsCarouselProps) {
  if (ads.length === 0) return null;

  return (
    <div className="relative group">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={16}
        slidesPerView={1}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={ads.length > 3}
        breakpoints={{
          480: {
            slidesPerView: 2,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 24,
          },
        }}
        className="!pb-12"
      >
        {ads.map((ad) => (
          <SwiperSlide key={ad.id}>
            <Link
              href={`/${lang}/ad/${ad.slug || ad.id}`}
              className="block bg-white rounded-xl overflow-hidden border-2 border-yellow-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline group/card"
            >
              {/* Featured Badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold rounded-full shadow-md">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured
                </span>
              </div>

              {/* Image */}
              <div className="relative w-full h-48 bg-gray-100">
                {ad.primaryImage ? (
                  <img
                    src={getImageUrl(ad.primaryImage, 'ads') as string}
                    alt={ad.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl text-gray-600">
                    {ad.categoryIcon || '📦'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap mb-2 group-hover/card:text-rose-500 transition-colors">
                  {ad.title}
                </h3>

                {/* Category */}
                {ad.categoryName && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                    <span>{ad.categoryIcon || '📁'}</span>
                    <span>{ad.categoryName}</span>
                  </div>
                )}

                {/* Price & Condition */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold text-emerald-500">
                    {formatPrice(ad.price)}
                  </span>
                  {ad.condition && (
                    <span className={`text-xs px-2.5 py-1 rounded-md text-white font-bold uppercase tracking-wide ${
                      ad.condition === 'new'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm'
                    }`}>
                      {ad.condition === 'new' ? 'New' : 'Used'}
                    </span>
                  )}
                </div>

                {/* Time */}
                {ad.publishedAt && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <span>🕒</span>
                    <span>{formatDateTime(ad.publishedAt)}</span>
                  </div>
                )}

                {/* Seller */}
                {ad.sellerName && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                    <span>{ad.sellerName}</span>
                    {/* Golden Badge for Verified Business */}
                    {ad.accountType === 'business' && ad.businessVerificationStatus === 'approved' && (
                      <img
                        src="/golden-badge.png"
                        alt="Verified Business"
                        title="Verified Business"
                        className="w-4 h-4"
                      />
                    )}
                    {/* Blue Badge for Verified Individual */}
                    {ad.accountType === 'individual' && (ad.individualVerified || ad.businessVerificationStatus === 'verified') && (
                      <img
                        src="/blue-badge.png"
                        alt="Verified Individual Seller"
                        title="Verified Individual Seller"
                        className="w-4 h-4"
                      />
                    )}
                  </div>
                )}
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 disabled:opacity-50">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 disabled:opacity-50">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
