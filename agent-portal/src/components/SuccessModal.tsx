import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { Check, AlertTriangle, Info, X } from "lucide-react";

export interface InfoCardDetail {
  label: string;
  value: string;
}

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  statusText?: string;
  reviewTimeText?: string;
  visibilityText?: string;
  notificationText?: string;
  infoDetails?: InfoCardDetail[];
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  variant?: "success" | "warning" | "info" | "error";
  icon?: React.ReactNode;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "Trip Submitted Successfully",
  description = "Your trip package has been submitted successfully and is now awaiting administrator review. Once approved, it will automatically become visible on the Traveler Portal. You'll receive a notification after approval.",
  statusText = "Pending Admin Review",
  reviewTimeText = "Usually within 24 hours",
  visibilityText = "Visible after approval",
  notificationText = "Email & Dashboard Notification",
  infoDetails,
  primaryButtonText = "Go to My Trips",
  secondaryButtonText = "Continue Editing",
  onPrimary,
  onSecondary,
  variant = "success",
  icon,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // ESC key closes
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrimaryClick = () => {
    if (onPrimary) onPrimary();
    onClose();
  };

  const handleSecondaryClick = () => {
    if (onSecondary) onSecondary();
    onClose();
  };

  const defaultDetails: InfoCardDetail[] = infoDetails || [
    { label: "Status", value: statusText },
    { label: "Review Time", value: reviewTimeText },
    { label: "Visibility", value: visibilityText },
    { label: "Notification", value: notificationText },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/55 backdrop-blur-md transition-all duration-300 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-[520px] bg-white dark:bg-slate-900 rounded-[20px] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 transition-all transform scale-100 animate-scaleUp text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5 flex items-center justify-center">
            {/* Ambient Glow */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />

            {/* Icon Bubble */}
            <div className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 transform transition-transform duration-300 hover:scale-105 animate-pop">
              {icon || <Check className="w-10 h-10 text-white stroke-[3]" />}
            </div>
          </div>

          {/* Title */}
          <h2
            id="modal-title"
            className="text-[26px] sm:text-[30px] font-bold tracking-tight leading-tight text-slate-900 dark:text-white"
          >
            {title}
          </h2>

          {/* Description */}
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-[440px]">
            {description}
          </p>
        </div>

        {/* Info Card */}
        {defaultDetails.length > 0 && (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              {defaultDetails.map((item, index) => (
                <div key={index} className="flex flex-col justify-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[12px] uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className="font-semibold text-sky-900 dark:text-sky-200 mt-0.5">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
          {secondaryButtonText && (
            <button
              onClick={handleSecondaryClick}
              className="w-full sm:flex-1 px-5 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {secondaryButtonText}
            </button>
          )}

          {primaryButtonText && (
            <button
              onClick={handlePrimaryClick}
              className="w-full sm:flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transform active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {primaryButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default SuccessModal;
