// src/components/AIChat/ConnectionStatus.jsx
import React from "react";
import { Wifi, RefreshCw } from "lucide-react";

export const ConnectionStatus = ({ isOnline, onRetry, isRetrying }) => {
  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
      <div className="flex items-center gap-2">
        <Wifi size={13} className="text-amber-500 animate-pulse" />
        <span>Connection Error</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
        >
          <RefreshCw size={10} className={isRetrying ? "animate-spin" : ""} />
          Retry
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
