export default function AllAdsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Skeleton */}
      <div className="py-5 px-4 bg-gray-50 border-b border-gray-200">
        <div className="max-w-screen-desktop mx-auto">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
      </div>

      {/* Container with sidebar layout */}
      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar Skeleton - Fixed width */}
        <aside className="hidden lg:block w-[280px] min-w-[280px] bg-white border-r border-gray-200 sticky top-0 self-start">
          <div className="p-6 space-y-6">
            {/* Categories Skeleton */}
            <div>
              <div className="h-5 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Price Range Skeleton */}
            <div className="pt-6 border-t border-gray-200">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
              </div>
            </div>

            {/* Sort Skeleton */}
            <div className="pt-6 border-t border-gray-200">
              <div className="h-5 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 px-4 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>

          {/* Ads Grid Skeleton */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {[...Array(12)].map((_, i) => (
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

          {/* Pagination Skeleton */}
          <div className="mt-12 flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
