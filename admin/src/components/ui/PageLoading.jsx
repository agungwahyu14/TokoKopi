export default function PageLoading() {
  return (
    <div className="w-full h-full min-h-[500px] p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-4 w-72 bg-gray-100 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      
      {/* Content Area Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="space-y-4 mt-8">
          <div className="h-12 w-full bg-gray-50 rounded-md animate-pulse"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-gray-100/50 rounded-md animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
