export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-20 animate-pulse">
      <div className="container mx-auto px-4 md:px-6">

        {/* Hero skeleton */}
        <div className="text-center py-16 md:py-24 max-w-4xl mx-auto space-y-6">
          <div className="h-14 md:h-20 bg-gray-200 rounded-xl w-3/4 mx-auto" />
          <div className="h-6 bg-gray-200 rounded-lg w-2/3 mx-auto" />
          <div className="h-12 bg-gray-200 rounded-full w-80 mx-auto" />
        </div>

        {/* Featured post skeleton */}
        <div className="mb-20">
          <div className="h-8 bg-gray-200 rounded-lg w-52 mb-8" />
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white flex flex-col md:flex-row">
            <div className="aspect-video md:w-1/2 bg-gray-200" />
            <div className="flex-1 p-8 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-full" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="h-2.5 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category chips skeleton */}
        <div className="mb-20">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-8" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-full w-28" />
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="mb-24">
          <div className="h-8 bg-gray-200 rounded-lg w-40 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                <div className="aspect-video bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-full" />
                      <div className="space-y-1.5">
                        <div className="h-3 bg-gray-200 rounded w-20" />
                        <div className="h-2.5 bg-gray-200 rounded w-14" />
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
