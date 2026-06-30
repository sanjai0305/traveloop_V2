// src/components/mobile/BottomSheet.jsx

import React, {
  useEffect,
  useRef,
} from "react";

const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = ["60vh"],
  showHandle = true,
  contentPadding = "px-4 py-4",
}) => {
  const sheetRef = useRef(null);
  const startYRef = useRef(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Android back button
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

  // Simple drag-to-dismiss
  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (startYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    if (deltaY > 80) {
      onClose();
    }
    startYRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* OVERLAY */}
      <div
        className="
          fixed
          inset-0
          z-[998]
          bg-black/40
          backdrop-blur-sm
          animate-fade-in
        "
        onClick={onClose}
      />

      {/* SHEET */}
      <div
        ref={sheetRef}
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-[999]

          bg-white

          rounded-t-[28px]

          shadow-xl

          overflow-hidden

          animate-slide-up-sheet
        "
        style={{
          maxHeight: snapPoints[0],
          paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
          maxWidth: "480px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* DRAG HANDLE */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-1">
            <div
              className="
                w-10
                h-1
                rounded-full
                bg-slate-200
              "
            />
          </div>
        )}

        {/* HEADER */}
        {title && (
          <div
            className="
              flex
              items-center
              justify-between

              px-6
              py-4

              border-b
              border-slate-100
            "
          >
            <h2
              className="
                text-lg
                font-bold
                text-slate-800
              "
            >
              {title}
            </h2>

            <button
              onClick={onClose}
              className="
                flex
                items-center
                justify-center

                w-8
                h-8

                rounded-full

                bg-slate-100

                text-slate-500

                active:bg-slate-200

                transition-colors
                duration-150
              "
            >
              ✕
            </button>
          </div>
        )}

        {/* CONTENT */}
        <div
          className={`
            overflow-y-auto
            ${contentPadding}
          `}
          style={{ maxHeight: `calc(${snapPoints[0]} - 80px)` }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
