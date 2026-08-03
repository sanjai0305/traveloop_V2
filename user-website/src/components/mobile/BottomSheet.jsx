// src/components/mobile/BottomSheet.jsx — Fully Responsive Bottom Sheet & Centered Modal System

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
}) => {
  const sheetRef = useRef(null);
  const startYRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

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

  // Handle hardware back event for Android
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

  // Touch drag-to-dismiss for mobile
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!isMobile || startYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    if (deltaY > 80) {
      onClose();
    }
    startYRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 1. OVERLAY / BACKDROP (Covers entire screen with blur & dark tint) */}
      <div
        className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* 2. FLEXBOX CENTERING CONTAINER (Guarantees zero off-screen displacement) */}
      <div className="fixed inset-0 z-[999] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-none">
        
        {/* 3. RESPONSIVE MODAL PANEL */}
        <div
          ref={sheetRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-[0_25px_70px_rgba(15,23,42,0.22)] transition-all duration-300 ${
            isMobile
              ? "w-full rounded-t-[24px] max-h-[85vh] animate-slide-up-sheet"
              : isTablet
              ? "w-[90vw] max-w-[600px] max-h-[85vh] rounded-[24px] animate-scale-in"
              : "w-[min(720px,90vw)] max-w-[720px] max-h-[80vh] rounded-[24px] animate-scale-in"
          }`}
          style={
            isMobile
              ? {
                  paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
                }
              : {}
          }
        >
          {/* MOBILE DRAG HANDLE */}
          {showHandle && isMobile && (
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          )}

          {/* HEADER BAR */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20 shrink-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* INTERNAL SCROLLABLE CONTENT AREA */}
          <div
            className={`flex-1 overflow-y-auto ${contentPadding}`}
          >
            {children}
          </div>
        </div>

      </div>
    </>
  );
};

export default BottomSheet;
