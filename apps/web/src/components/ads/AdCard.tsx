// @ts-nocheck
'use client';

import Link from 'next/link';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';
import { getImageUrl } from '@/lib/images/imageUrl';

type AdCardVariant = 'default' | 'compact' | 'mini' | 'horizontal';

interface AdCardProps {
    ad: {
        id: number;
        title: string;
        price: number;
        primaryImage?: string | null;
        categoryName?: string | null;
        categoryIcon?: string | null;
        createdAt?: string | Date;
        publishedAt?: string | Date;
        sellerName: string;
        isFeatured?: boolean;
        isUrgent?: boolean;
        isSticky?: boolean;
        condition?: string | null;
        seoSlug?: string;
        slug?: string;
        accountType?: string;
        businessVerificationStatus?: string;
        individualVerified?: boolean;
    };
    lang?: string;
    variant?: AdCardVariant;
}

// Desktop Card Component
function DesktopCard({ ad, lang, adUrl, imageUrl }: { ad: AdCardProps['ad']; lang: string; adUrl: string; imageUrl: string | null }) {
    return (
        <Link
            href={`/${lang}/ad/${adUrl}`}
            className="group block bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg no-underline text-inherit"
        >
            <div className="relative w-full h-48 bg-gray-100">
                {ad.isFeatured && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white rounded font-semibold z-10 px-3 py-1 text-xs">
                        ⭐ FEATURED
                    </div>
                )}
                {ad.isUrgent && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white rounded font-semibold z-10 px-3 py-1 text-xs">
                        🔥 URGENT
                    </div>
                )}
                {ad.isSticky && !ad.isFeatured && !ad.isUrgent && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white rounded font-semibold z-10 px-3 py-1 text-xs">
                        📌 STICKY
                    </div>
                )}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-gray-600">
                        {ad.categoryIcon || '📦'}
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold mb-1.5 text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
                    {ad.title}
                </h3>
                {ad.categoryName && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-1.5">
                        <span>{ad.categoryIcon || '📁'}</span>
                        <span className="truncate">{ad.categoryName}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-rose-600">{formatPrice(ad.price)}</span>
                    {ad.condition && (
                        <span className={`rounded-full font-semibold px-3 py-1 text-xs ${ad.condition === 'new'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            }`}>
                            {ad.condition === 'new' ? 'NEW' : 'USED'}
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-500">
                    <div className="flex items-center gap-1 mb-1">
                        <span>🕐</span>
                        <span>{formatDateTime(ad.publishedAt || ad.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-800">{ad.sellerName}</span>
                        {(ad.accountType === 'business' && (ad.businessVerificationStatus === 'verified' || ad.businessVerificationStatus === 'approved')) && (
                            <img src="/golden-badge.png" alt="Verified Business" className="w-4 h-4 flex-shrink-0" />
                        )}
                        {(ad.accountType === 'individual' && ad.individualVerified) && (
                            <img src="/blue-badge.png" alt="Verified Individual" className="w-4 h-4 flex-shrink-0" />
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

// Mobile Compact Card Component
function MobileCard({ ad, lang, adUrl, imageUrl }: { ad: AdCardProps['ad']; lang: string; adUrl: string; imageUrl: string | null }) {
    return (
        <Link
            href={`/${lang}/ad/${adUrl}`}
            className="group block bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg no-underline text-inherit"
        >
            <div className="relative w-full h-36 bg-gray-100">
                {ad.isFeatured && (
                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white rounded font-semibold z-10 px-2 py-0.5 text-[10px]">⭐</div>
                )}
                {ad.isUrgent && (
                    <div className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded font-semibold z-10 px-2 py-0.5 text-[10px]">🔥</div>
                )}
                {ad.isSticky && !ad.isFeatured && !ad.isUrgent && (
                    <div className="absolute top-1.5 left-1.5 bg-blue-500 text-white rounded font-semibold z-10 px-2 py-0.5 text-[10px]">📌</div>
                )}
                {ad.condition && (
                    <div className={`absolute bottom-1.5 right-1.5 rounded-full font-semibold z-10 px-2 py-0.5 text-[10px] ${ad.condition === 'new'
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        }`}>
                        {ad.condition === 'new' ? 'NEW' : 'USED'}
                    </div>
                )}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                        {ad.categoryIcon || '📦'}
                    </div>
                )}
            </div>
            <div className="p-2.5">
                <h3 className="text-sm font-semibold mb-2 text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
                    {ad.title}
                </h3>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span className="text-[10px]">{ad.categoryIcon || '📁'}</span>
                        <span className="truncate">{ad.categoryName}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-base font-bold text-rose-600">{formatPrice(ad.price)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                        <span className="font-medium text-gray-800 truncate max-w-[100px]">{ad.sellerName}</span>
                        {(ad.accountType === 'business' && (ad.businessVerificationStatus === 'verified' || ad.businessVerificationStatus === 'approved')) && (
                            <img src="/golden-badge.png" alt="Verified Business" className="w-3 h-3 flex-shrink-0" />
                        )}
                        {(ad.accountType === 'individual' && ad.individualVerified) && (
                            <img src="/blue-badge.png" alt="Verified Individual" className="w-3 h-3 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center justify-end gap-0.5 text-[11px] text-gray-400">
                        <span>🕐</span>
                        <span>{formatDateTime(ad.publishedAt || ad.createdAt)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function AdCard({ ad, lang = 'en', variant = 'default' }: AdCardProps) {
    const adUrl = ad.seoSlug || ad.slug || `ad-${ad.id}`;
    const imageUrl = ad.primaryImage ? getImageUrl(ad.primaryImage, 'ads') : null;

    // If explicit variant is set, use it
    if (variant === 'compact') {
        return <MobileCard ad={ad} lang={lang} adUrl={adUrl} imageUrl={imageUrl} />;
    }

    if (variant === 'mini') {
        return (
            <Link
                href={`/${lang}/ad/${adUrl}`}
                className="group block bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg no-underline text-inherit"
            >
                <div className="relative w-full h-32 bg-gray-100">
                    {imageUrl ? (
                        <img src={imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-gray-600">{ad.categoryIcon || '📦'}</div>
                    )}
                </div>
                <div className="p-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{ad.title}</h3>
                    <span className="text-base font-bold text-rose-600">{formatPrice(ad.price)}</span>
                </div>
            </Link>
        );
    }

    if (variant === 'horizontal') {
        return (
            <Link
                href={`/${lang}/ad/${adUrl}`}
                className="group flex bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg no-underline text-inherit"
            >
                <div className="relative w-[35%] h-32 bg-gray-100 flex-shrink-0">
                    {ad.condition && (
                        <div className={`absolute bottom-1.5 right-1.5 rounded-full font-semibold z-10 px-2 py-0.5 text-[10px] ${ad.condition === 'new'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            }`}>
                            {ad.condition === 'new' ? 'NEW' : 'USED'}
                        </div>
                    )}
                    {imageUrl ? (
                        <img src={imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">{ad.categoryIcon || '📦'}</div>
                    )}
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">{ad.title}</h3>
                    <div>
                        <span className="text-lg font-bold text-rose-600">{formatPrice(ad.price)}</span>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                            <span className="font-medium text-gray-800 truncate max-w-[80px]">{ad.sellerName}</span>
                            {(ad.accountType === 'business' && (ad.businessVerificationStatus === 'verified' || ad.businessVerificationStatus === 'approved')) && (
                                <img src="/golden-badge.png" alt="Verified Business" className="w-3 h-3" />
                            )}
                            {(ad.accountType === 'individual' && ad.individualVerified) && (
                                <img src="/blue-badge.png" alt="Verified Individual" className="w-3 h-3" />
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // DEFAULT: Render BOTH desktop and mobile, show/hide with CSS media queries
    return (
        <>
            {/* Desktop version - hidden on mobile */}
            <div className="hidden md:block">
                <DesktopCard ad={ad} lang={lang} adUrl={adUrl} imageUrl={imageUrl} />
            </div>
            {/* Mobile version - hidden on desktop */}
            <div className="block md:hidden">
                <MobileCard ad={ad} lang={lang} adUrl={adUrl} imageUrl={imageUrl} />
            </div>
        </>
    );
}
