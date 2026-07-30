import React, { useEffect } from "react";
import { X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface DesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidth?: string; // e.g. "1000px" or "max-w-[1000px]"
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export const DesktopModal: React.FC<DesktopModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = "1000px",
  children,
  footer,
  onBack,
  backLabel = "Back",
  className = "",
}) => {
  // ESC key listener & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8">
          {/* Overlay / Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          {/* Centered Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`relative w-full max-w-[1000px] w-[95vw] sm:w-[90vw] lg:w-[min(1000px,90vw)] max-h-[90vh] bg-white dark:bg-slate-900 rounded-[20px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-10 ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="desktop-modal-title"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                    aria-label={backLabel}
                  >
                    <ArrowLeft size={16} className="text-teal-500" />
                    <span className="hidden sm:inline">{backLabel}</span>
                  </button>
                )}

                {icon && (
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                    {icon}
                  </div>
                )}

                <div className="min-w-0">
                  <h2 id="desktop-modal-title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body Only */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
              {children}
            </div>

            {/* Sticky Footer */}
            {footer && (
              <div className="sticky bottom-0 z-20 px-6 py-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
