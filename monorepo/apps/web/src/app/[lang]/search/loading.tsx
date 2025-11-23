export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Skeleton */}
      <div className="py-5 px-4 bg-gray-50 border-b border-gray-200">
        <div className="max-w-screen-desktop mx-auto">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* Page Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>

        {/* Filters and Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Filters Sidebar Skeleton */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              {/* Category Filter */}
              <div>
                <div className="h-5 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Location Filter */}
              <div className="pt-6 border-t border-gray-200">
                <div className="h-5 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Price Range */}
              <div className="pt-6 border-t border-gray-200">
                <div className="h-5 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                </div>
              </div>

              {/* Condition Filter */}
              <div className="pt-6 border-t border-gray-200">
                <div className="h-5 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <div className="pt-6">
                <div className="h-11 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div>
            {/* Sort Dropdown Skeleton */}
            <div className="flex justify-between items-center mb-6">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>

            {/* Ads Grid Skeleton */}
            <div className="grid grid-cols-1 mobile:grid-cols-2 desktop:grid-cols-3 gap-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
