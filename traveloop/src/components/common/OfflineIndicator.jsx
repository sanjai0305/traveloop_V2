import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [transitionToOnline, setTransitionToOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTransitionToOnline(true);
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
        setTransitionToOnline(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setTransitionToOnline(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check: if offline on load, show it
    if (!navigator.onLine) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsOnline(true);
      setTransitionToOnline(true);
      setShowStatus(true);
      setTimeout(() => {
        setShowStatus(false);
        setTransitionToOnline(false);
      }, 3000);
    } else {
      alert("Connection still unavailable. Please check your internet settings.");
    }
  };

  return (
    <AnimatePresence>
      {(!isOnline || showStatus) && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-16 left-4 right-4 z-[99999] flex justify-center"
        >
          {transitionToOnline ? (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-500 text-white rounded-full shadow-lg border border-emerald-400 max-w-sm">
              <Wifi size={16} className="animate-pulse" />
              <span className="text-xs font-bold">You are back online! Syncing data...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-800/95 backdrop-blur-md text-white rounded-2xl shadow-lg border border-slate-700/50 w-full max-w-sm">
              <div className="flex items-center gap-2.5">
                <WifiOff size={16} className="text-rose-400 animate-pulse flex-shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Offline Mode</span>
                  <span className="text-[10px] text-slate-400">Save operations disabled</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all text-white rounded-full text-[10px] font-bold shadow-sm"
                >
                  Retry
                </button>
                <button
                  onClick={() => setShowStatus(false)}
                  className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
                  aria-label="Dismiss offline banner"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
