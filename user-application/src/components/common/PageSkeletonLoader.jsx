import React from "react";

const PageSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-safe pb-safe px-4" aria-busy="true" aria-label="Loading page content">
      {/* Skeleton Header */}
      <div className="h-14 w-full flex items-center justify-between mb-6">
        <div className="w-10 h-10 rounded-full skeleton" />
        <div className="w-32 h-6 rounded-lg skeleton" />
        <div className="w-10 h-10 rounded-full skeleton" />
      </div>

      {/* Skeleton Content Card */}
      <div className="flex-1 space-y-4">
        <div className="h-44 w-full rounded-[24px] skeleton" />
        
        <div className="space-y-2.5">
          <div className="h-6 w-1/3 rounded-md skeleton" />
          <div className="h-4 w-full rounded-md skeleton" />
          <div className="h-4 w-5/6 rounded-md skeleton" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="h-28 rounded-[20px] skeleton" />
          <div className="h-28 rounded-[20px] skeleton" />
        </div>

        <div className="space-y-3 mt-6">
          <div className="h-20 w-full rounded-[20px] skeleton" />
          <div className="h-20 w-full rounded-[20px] skeleton" />
        </div>
      </div>

      {/* Skeleton Bottom Nav */}
      <div className="h-[76px] w-full flex justify-around items-center border-t border-slate-100 bg-white rounded-t-[24px] -mx-4 px-4 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full skeleton" />
            <div className="w-10 h-2.5 rounded-sm skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageSkeletonLoader;
