// src/components/mobile/BottomSheet.jsx
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = ["85vh"],
  showHandle = true,
  contentPadding = "px-6 py-5",
  variant = "side", // "side" (right-side drawer on desktop) | "dialog" (centered modal on desktop)
  maxWidth = "max-w-lg",
}) => {
  const sheetRef = useRef(null);
  const startYRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll & ESC key listener when open
  useEffect(() => {
    const handleKeyDown = (e) => {
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

  // Handle hardware back event
  useEffect(() => {
    if (!isOpen) return;
    const handleHardwareBack = (e) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener("hardwareBack", handleHardwareBack);
    return () => {
      window.removeEventListener("hardwareBack", handleHardwareBack);
    };
  }, [isOpen, onClose]);

  // Simple drag-to-dismiss for mobile
  const handleTouchStart = (e) => {
    if (isDesktop) return;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (isDesktop || startYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    if (deltaY > 80) {
      onClose();
    }
    startYRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* OVERLAY / BACKDROP */}
      <div
        className="fixed inset-0 z-[998] bg-black/65 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* RESPONSIVE CONTAINER */}
      <div
        ref={sheetRef}
        className={`fixed z-[999] bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${
          isDesktop
            ? variant === "dialog"
              ? `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl w-[92vw] sm:w-[90vw] ${maxWidth} max-h-[85dvh] animate-scale-in`
              : "top-0 right-0 bottom-0 h-full h-[100dvh] w-full sm:w-[460px] lg:w-[520px] max-w-full border-l animate-slide-left-sheet"
            : "bottom-0 left-0 right-0 rounded-t-[28px] w-full max-w-[480px] mx-auto animate-slide-up-sheet"
        }`}
        style={
          isDesktop
            ? {}
            : {
                maxHeight: snapPoints[0] || "85vh",
                paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
              }
        }
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* MOBILE DRAG HANDLE */}
        {showHandle && !isDesktop && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        )}

        {/* HEADER */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 active:scale-95 transition-all flex-shrink-0"
              aria-label="Close dialog"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* CONTENT */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${contentPadding}`}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
