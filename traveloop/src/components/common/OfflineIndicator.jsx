// src/components/common/OfflineIndicator.jsx
//
// Detects real connectivity by pinging the backend health endpoint.
// navigator.onLine is NOT used — it is unreliable inside Capacitor Android
// because the WebView always reports online even when CORS blocks all requests.

import React, { useState, useEffect, useRef } from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HEALTH_URL = `${import.meta.env.VITE_API_URL || "https://traveloopv2.duckdns.org"}/api/health`;
const POLL_INTERVAL_MS  = 10_000; // check every 10 seconds
const TIMEOUT_MS        = 6_000;  // treat as offline if no response in 6 s

async function pingBackend() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(HEALTH_URL, {
      method: "GET",
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(id);
    return res.ok;
  } catch {
    return false;
  }
}

const OfflineIndicator = () => {
  const [isOnline, setIsOnline]               = useState(true);   // optimistic start
  const [showBanner, setShowBanner]           = useState(false);
  const [transitionToOnline, setTransition]   = useState(false);
  const prevOnlineRef = useRef(true);
  const intervalRef   = useRef(null);
  const dismissTimer  = useRef(null);

  const runCheck = async () => {
    const online = await pingBackend();
    const wasOnline = prevOnlineRef.current;
    prevOnlineRef.current = online;

    setIsOnline(online);

    if (!online && wasOnline) {
      // Just went offline — show banner
      setTransition(false);
      setShowBanner(true);
    } else if (online && !wasOnline) {
      // Just came back online — show "back online" banner briefly
      setTransition(true);
      setShowBanner(true);
      clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => {
        setShowBanner(false);
        setTransition(false);
      }, 3000);
    }
    // If state unchanged, do nothing — no flicker
  };

  useEffect(() => {
    // First check immediately (slight delay so app renders first)
    const firstCheck = setTimeout(runCheck, 1500);

    // Then poll on interval
    intervalRef.current = setInterval(runCheck, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(firstCheck);
      clearInterval(intervalRef.current);
      clearTimeout(dismissTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = async () => {
    const online = await pingBackend();
    if (online) {
      prevOnlineRef.current = true;
      setIsOnline(true);
      setTransition(true);
      setShowBanner(true);
      clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => {
        setShowBanner(false);
        setTransition(false);
      }, 3000);
    }
    // If still offline, keep banner visible — no alert
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="offline-banner"
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
                  onClick={() => setShowBanner(false)}
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
