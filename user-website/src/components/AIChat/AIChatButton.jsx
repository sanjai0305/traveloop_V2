// src/components/AIChat/AIChatButton.jsx
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Bot } from "lucide-react";

export const AIChatButton = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="fixed z-40 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-teal-500 via-cyan-500 to-blue-600 shadow-[0_10px_25px_rgba(20,184,181,0.4)] border border-white/20 cursor-pointer group"
      style={{
        bottom: "calc(24px + max(env(safe-area-inset-bottom), 0px))",
        right: "24px",
      }}
      aria-label="Open Traveloop AI Assistant"
    >
      {/* Outer Pulse Glow Ring */}
      <span className="absolute inset-0 rounded-full bg-teal-400/40 animate-ping pointer-events-none opacity-75" />

      {/* Rotating Sparkles Icon */}
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex items-center justify-center text-white"
      >
        <Sparkles size={24} className="text-white drop-shadow-md" />
      </motion.div>

      {/* Online / Active Badge Dot */}
      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 shadow-xs" />

      {/* Tooltip on Hover */}
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md backdrop-blur-sm">
        🤖 Ask Traveloop AI
      </span>
    </motion.button>
  );
};

export default AIChatButton;
