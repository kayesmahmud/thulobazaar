export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero Section Skeleton */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          {/* Title Skeleton */}
          <div className="flex justify-center mb-4">
            <div className="h-12 md:h-16 xl:h-20 bg-white/20 rounded w-3/4 animate-pulse"></div>
          </div>

          {/* Subtitle Skeleton */}
          <div className="flex justify-center mb-8">
            <div className="h-6 md:h-8 bg-white/20 rounded w-1/2 animate-pulse"></div>
          </div>

          {/* Search Bar Skeleton */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="h-16 bg-white/90 rounded-2xl animate-pulse"></div>
          </div>

          {/* CTA Buttons Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="h-14 bg-white/90 rounded-xl w-48 mx-auto sm:mx-0 animate-pulse"></div>
            <div className="h-14 bg-white/20 rounded-xl w-48 mx-auto sm:mx-0 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Categories Section Skeleton */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-100">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Ads Section Skeleton */}
      <div className="max-w-7xl mx-auto py-12 px-4 mb-12">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
              {/* Image Skeleton */}
              <div className="bg-gray-200 h-48 animate-pulse"></div>

              {/* Content Skeleton */}
              <div className="p-4">
                {/* Title */}
                <div className="h-5 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>

                {/* Price */}
                <div className="h-7 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>

                {/* Metadata */}
                <div className="flex gap-2 mb-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>

                {/* Seller */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="h-5 bg-gray-700 rounded w-64 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
