// src/components/AIChat/ChatHeader.jsx
import React from "react";
import { Bot, Sparkles, X, Trash2 } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";

export const ChatHeader = ({ isOnline, onRetry, onClearHistory, onClose }) => {
  return (
    <div
      className="px-5 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 shrink-0"
      style={{
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(20, 184, 181, 0.85))",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Robot Icon Avatar */}
        <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs text-white">
          <Bot size={22} className="text-white" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
              🤖 Traveloop AI
            </h3>
            <ConnectionStatus isOnline={isOnline} onRetry={onRetry} />
          </div>
          <p className="text-[11px] text-white/75 font-semibold flex items-center gap-1 mt-0.5">
            <Sparkles size={11} className="text-teal-300" />
            <span>Powered by AI • Always Online</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {onClearHistory && (
          <button
            type="button"
            onClick={onClearHistory}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Clear Chat History"
          >
            <Trash2 size={15} />
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          title="Close AI Assistant"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
