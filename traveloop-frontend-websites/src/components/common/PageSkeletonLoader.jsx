import React from "react";

const PageSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col px-6 py-8" aria-busy="true" aria-label="Loading page content">
      {/* Skeleton Header */}
      <div className="h-16 w-full flex items-center justify-between mb-8 max-w-7xl mx-auto border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl skeleton" />
          <div className="w-28 h-5 rounded-lg skeleton" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg skeleton" />
          <div className="w-8 h-8 rounded-full skeleton" />
        </div>
      </div>

      {/* Skeleton Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto space-y-6">
        {/* Banner/Hero Skeleton */}
        <div className="h-48 md:h-64 w-full rounded-[24px] skeleton" />
        
        {/* Title and details skeleton */}
        <div className="space-y-3">
          <div className="h-7 w-1/4 rounded-md skeleton" />
          <div className="h-4 w-1/2 rounded-md skeleton" />
        </div>

        {/* Responsive Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="h-40 rounded-[20px] skeleton" />
          <div className="h-40 rounded-[20px] skeleton" />
          <div className="h-40 rounded-[20px] skeleton" />
        </div>

        {/* List items skeletons */}
        <div className="space-y-4 mt-8">
          <div className="h-16 w-full rounded-[20px] skeleton" />
          <div className="h-16 w-full rounded-[20px] skeleton" />
        </div>
      </div>
    </div>
  );
};

export default PageSkeletonLoader;
