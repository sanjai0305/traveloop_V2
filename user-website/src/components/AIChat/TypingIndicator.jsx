// src/components/AIChat/TypingIndicator.jsx
import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-2 my-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-xs flex-shrink-0">
        <Sparkles size={12} className="text-white animate-spin-slow" />
      </div>
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-4 py-3 rounded-[20px] rounded-tl-sm flex items-center gap-1.5 shadow-xs">
        <span className="text-xs font-bold text-slate-400 mr-1">Traveloop AI is thinking</span>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-teal-500"
            animate={{ y: [-3, 3, -3], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
