import React from "react";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
  onBackClick?: () => void;
  className?: string;
}

export const BackButton: React.FC<{
  label?: string;
  onClick?: () => void;
  className?: string;
}> = ({ label = "Back", onClick, className = "" }) => {
  const handleBack = () => {
    if (onClick) {
      onClick();
    } else if (typeof window !== "undefined" && window.history) {
      window.history.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer ${className}`}
      aria-label="Navigate to previous page"
    >
      <ArrowLeft size={14} className="text-teal-500" />
      <span>{label}</span>
    </button>
  );
};

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  items,
  showBackButton = true,
  onBackClick,
  className = "",
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 py-2 ${className}`}>
      {showBackButton && <BackButton onClick={onBackClick} />}

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <Home size={12} className="text-teal-500" />
          <span>Home</span>
        </a>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
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
                <a
                  href={item.href}
                  className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </a>
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
  );
};
