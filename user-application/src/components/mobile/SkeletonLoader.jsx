// src/components/mobile/SkeletonLoader.jsx

import React from "react";

// ─── PRIMITIVE SKELETON ──────────────────────────────────────────────────────
export const SkeletonBox = ({ className = "", style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={style}
  />
);

// ─── TRIP CARD SKELETON ──────────────────────────────────────────────────────
export const TripCardSkeleton = () => (
  <div className="mobile-card p-4">
    <SkeletonBox className="w-full h-40 rounded-mobile-lg mb-4" />
    <div className="space-y-3">
      <SkeletonBox className="h-5 w-2/3 rounded-lg" />
      <SkeletonBox className="h-4 w-1/2 rounded-lg" />
      <div className="flex gap-3 mt-4">
        <SkeletonBox className="h-8 flex-1 rounded-xl" />
        <SkeletonBox className="h-8 flex-1 rounded-xl" />
        <SkeletonBox className="h-8 flex-1 rounded-xl" />
      </div>
    </div>
  </div>
);

// ─── DESTINATION CARD SKELETON ───────────────────────────────────────────────
export const DestinationCardSkeleton = () => (
  <div className="mobile-card">
    <SkeletonBox className="w-full h-48 rounded-t-mobile-xl" />
    <div className="p-4 space-y-3">
      <SkeletonBox className="h-5 w-3/4 rounded-lg" />
      <SkeletonBox className="h-4 w-1/2 rounded-lg" />
      <div className="flex justify-between items-center mt-2">
        <SkeletonBox className="h-6 w-20 rounded-lg" />
        <SkeletonBox className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  </div>
);

// ─── PROFILE SKELETON ────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
  <div className="animate-fade-in">
    {/* Hero */}
    <SkeletonBox className="w-full h-52 rounded-b-mobile-3xl" />

    {/* Avatar */}
    <div className="flex justify-center -mt-12">
      <SkeletonBox className="w-24 h-24 rounded-full" />
    </div>

    {/* Info */}
    <div className="flex flex-col items-center gap-3 mt-4 px-6">
      <SkeletonBox className="h-7 w-40 rounded-lg" />
      <SkeletonBox className="h-4 w-28 rounded-lg" />
    </div>

    {/* Stats */}
    <div className="flex justify-center gap-8 mt-6 px-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <SkeletonBox className="h-7 w-12 rounded-lg" />
          <SkeletonBox className="h-3 w-16 rounded-md" />
        </div>
      ))}
    </div>

    {/* List items */}
    <div className="px-4 mt-8 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-mobile-xl border border-slate-100">
          <SkeletonBox className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-24 rounded-md" />
            <SkeletonBox className="h-3 w-36 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── ACTIVITY CARD SKELETON ──────────────────────────────────────────────────
export const ActivityCardSkeleton = () => (
  <div className="mobile-card flex gap-4 p-4">
    <SkeletonBox className="w-24 h-24 rounded-mobile-lg flex-shrink-0" />
    <div className="flex-1 space-y-3">
      <SkeletonBox className="h-5 w-full rounded-lg" />
      <SkeletonBox className="h-4 w-2/3 rounded-lg" />
      <div className="flex gap-2">
        <SkeletonBox className="h-6 w-16 rounded-full" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

// ─── DASHBOARD SECTION SKELETON ──────────────────────────────────────────────
export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="px-4 pt-4 flex items-center gap-4">
      <SkeletonBox className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="space-y-2">
        <SkeletonBox className="h-5 w-36 rounded-lg" />
        <SkeletonBox className="h-3 w-24 rounded-md" />
      </div>
    </div>

    {/* Search */}
    <div className="px-4">
      <SkeletonBox className="h-12 w-full rounded-full" />
    </div>

    {/* Hero */}
    <div className="px-4">
      <SkeletonBox className="h-52 w-full rounded-mobile-3xl" />
    </div>

    {/* Cards */}
    <div className="px-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <DestinationCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default SkeletonLoader;

// Default export a generic one
function SkeletonLoader({ variant = "trip", count = 3 }) {
  const components = {
    trip: TripCardSkeleton,
    destination: DestinationCardSkeleton,
    activity: ActivityCardSkeleton,
    profile: ProfileSkeleton,
    dashboard: DashboardSkeleton,
  };

  const Component = components[variant] || TripCardSkeleton;

  if (variant === "profile" || variant === "dashboard") {
    return <Component />;
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
