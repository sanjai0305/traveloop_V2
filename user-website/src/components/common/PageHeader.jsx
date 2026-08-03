import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  tripTitle,
  tripId,
  fallbackUrl = "/my-trips",
  onBack,
  actions,
  badge,
  className = ""
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackUrl);
    }
  };

  const defaultBreadcrumbs = breadcrumbs || [
    { label: "My Trips", href: "/my-trips" },
    ...(tripTitle ? [{ label: tripTitle, href: tripId ? `/build-itinerary/${tripId}` : "/my-trips" }] : []),
    { label: title }
  ];

  return (
    <div className={`mb-6 space-y-3 ${className}`}>
      {/* Top Bar: Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            aria-label="Go Back"
          >
            <ArrowLeft size={14} className="text-teal-500" />
            <span>Back</span>
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 flex-wrap">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <Home size={12} className="text-teal-500" />
              <span>Home</span>
            </Link>

            {defaultBreadcrumbs.map((item, idx) => {
              const isLast = idx === defaultBreadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
                  {isLast ? (
                    <span className="font-extrabold text-teal-600 dark:text-teal-400 truncate max-w-[200px]" aria-current="page">
                      {item.label}
                    </span>
                  ) : item.onClick ? (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors truncate max-w-[150px]"
                    >
                      {item.label}
                    </button>
                  ) : item.href ? (
                    <Link
                      to={item.href}
                      className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors truncate max-w-[150px]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

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
}
