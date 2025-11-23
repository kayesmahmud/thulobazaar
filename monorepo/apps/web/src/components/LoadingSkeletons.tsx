/**
 * Loading Skeleton Components
 * Provides skeleton screens for better perceived performance while data loads
 */

export function AdCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Image skeleton */}
      <div className="h-48 bg-gray-200 animate-pulse" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />

        {/* Category */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />

        {/* Price & Condition */}
        <div className="flex items-center gap-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
        </div>

        {/* Meta info */}
        <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />

        {/* Seller */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
      </div>
    </div>
  );
}

export function AdCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 mobile:grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AdCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
          {/* Icon */}
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mb-3" />

          {/* Number */}
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2" />

          {/* Label */}
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
        </div>
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-100">
      {/* Icon */}
      <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse mx-auto mb-3" />

      {/* Name */}
      <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mx-auto" />
    </div>
  );
}

export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 mobile:grid-cols-3 tablet:grid-cols-4 desktop:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AdDetailSkeleton() {
  return (
    <div className="max-w-screen-desktop mx-auto py-8 px-4">
      <div className="grid grid-cols-1 desktop:grid-cols-3 gap-8">
        {/* Left Column - Images & Details */}
        <div className="desktop:col-span-2 space-y-6">
          {/* Breadcrumb */}
          <div className="flex gap-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
          </div>

          {/* Image Gallery */}
          <div className="bg-white rounded-xl p-4">
            <div className="h-96 bg-gray-200 rounded-lg animate-pulse mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          </div>
        </div>

        {/* Right Column - Seller Card */}
        <div>
          <div className="bg-white rounded-xl p-6 space-y-4 sticky top-20">
            {/* Price */}
            <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />

            {/* Seller info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-100">
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 px-4 space-y-2">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-2/3" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>

      {/* Price */}
      <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />

      {/* Actions */}
      <div className="flex gap-2 ml-4">
        <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Form field 1 */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Form field 2 */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Form field 3 */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Button */}
      <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-32" />
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />

        {/* Text */}
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}

export function InlineLoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`} />
  );
}
