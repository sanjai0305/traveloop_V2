import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right" | "bottom";
  title?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  side = "left",
  title,
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Framer Motion transition variants based on side
  const slideVariants = {
    left: {
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
    },
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    },
    bottom: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
    },
  };

  const sideClasses = {
    left: "left-0 top-0 bottom-0 w-[280px] border-r",
    right: "right-0 top-0 bottom-0 w-[280px] border-l",
    bottom: "bottom-0 left-0 right-0 h-[400px] rounded-t-3xl border-t",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
          />

          {/* Drawer content sliding container */}
          <motion.div
            initial={slideVariants[side].initial}
            animate={slideVariants[side].animate}
            exit={slideVariants[side].exit}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className={`absolute bg-slate-900 border-slate-800 shadow-2xl z-10 flex flex-col ${sideClasses[side]}`}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-850 flex justify-between items-center bg-slate-950/20">
              {title && (
                <span className="font-poppins font-black text-xs text-slate-400 uppercase tracking-wider">
                  {title}
                </span>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                aria-label="Close menu drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Links and children */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Drawer;
