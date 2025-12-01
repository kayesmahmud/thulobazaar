import Breadcrumb from '@/components/Breadcrumb';

export default function AdDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Skeleton */}
      <div className="py-5 px-4 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Main Content */}
          <div>
            {/* Image Gallery Skeleton */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
              <div className="bg-gray-200 h-[400px] rounded-lg mb-4 animate-pulse"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-200 w-20 h-20 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Ad Details Skeleton */}
            <div className="bg-white rounded-xl p-8 mb-6 shadow-sm">
              {/* Title */}
              <div className="mb-6">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                </div>
              </div>

              {/* Price */}
              <div className="h-10 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>

              {/* Badges */}
              <div className="flex gap-2 mb-8 flex-wrap">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-7 bg-gray-200 rounded w-24 animate-pulse"></div>
                ))}
              </div>

              {/* Description */}
              <div className="mb-8">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
                </div>
              </div>

              {/* Specifications */}
              <div className="mb-6">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="h-3 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Seller Card Skeleton */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>

              {/* Seller Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
              </div>

              {/* Phone Button */}
              <div className="h-12 bg-gray-200 rounded-lg mb-3 animate-pulse"></div>

              {/* Message Button */}
              <div className="h-12 bg-gray-200 rounded-lg mb-6 animate-pulse"></div>

              {/* Report */}
              <div className="pt-6 border-t border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-28 mx-auto animate-pulse"></div>
              </div>
            </div>

            {/* Safety Tips Skeleton */}
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <div className="h-6 bg-amber-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-amber-200 rounded w-full animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
