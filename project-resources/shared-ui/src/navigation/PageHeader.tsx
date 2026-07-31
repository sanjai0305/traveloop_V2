import React from "react";
import { BreadcrumbNav, type BreadcrumbItem } from "./BreadcrumbNav";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  tripTitle?: string;
  tripId?: string;
  fallbackUrl?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  tripTitle,
  tripId,
  onBack,
  actions,
  badge,
  className = "",
}) => {
  const defaultItems: BreadcrumbItem[] = breadcrumbs || [
    { label: "My Trips", href: "/my-trips" },
    ...(tripTitle ? [{ label: tripTitle, href: tripId ? `/trip/${tripId}` : "/my-trips" }] : []),
    { label: title },
  ];

  return (
    <div className={`mb-6 space-y-3 ${className}`}>
      {/* Top Bar: Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <BreadcrumbNav
          items={defaultItems}
          showBackButton={true}
          onBackClick={onBack}
        />
        {badge && <div className="flex items-center gap-2">{badge}</div>}
      </div>

      {/* Title & Subtitle Row */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>
        )}
      </div>
    </div>
  );
};
