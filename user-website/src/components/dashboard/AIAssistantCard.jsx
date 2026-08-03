// src/components/dashboard/AIAssistantCard.jsx

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Bot, Compass, Wand2 } from "lucide-react";

const AIAssistantCard = ({ onOpen }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2 }}
    whileHover={{ y: -4 }}
    className="mx-4 mb-6 lg:mx-0 lg:mb-8 rounded-[24px] overflow-hidden relative shadow-[0_15px_50px_rgba(6,182,212,0.12)] border border-cyan-200/40 dark:border-cyan-500/20 group cursor-pointer"
    style={{ background: "linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)" }}
    onClick={onOpen}
  >
    {/* Decorative Animated Floating Circles */}
    <motion.div
      animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"
    />
    <motion.div
      animate={{ scale: [1, 1.15, 1], x: [0, 15, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-cyan-300/20 blur-xl pointer-events-none"
    />

    <div className="relative p-6 lg:p-8 flex items-center justify-between gap-4 lg:gap-6 backdrop-blur-md">
      {/* Icon Badge */}
      <div className="flex items-center gap-5">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-[22px] flex items-center justify-center flex-shrink-0 bg-white/15 backdrop-blur-xl border border-white/25 shadow-lg shadow-black/5"
        >
          <Sparkles className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[11px] font-black uppercase tracking-wider mb-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Travel Concierge</span>
          </div>
          <h3 className="text-white text-lg lg:text-2xl font-black leading-tight tracking-tight">
            Plan your dream itinerary with AI
          </h3>
          <p className="text-white/80 text-xs lg:text-sm mt-1 font-medium">
            Instant personalized routes · Smart budget estimates · Custom packing checklists
          </p>
        </div>
      </div>

      {/* Glowing Arrow CTA Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0 bg-white text-cyan-600 font-extrabold flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.4)] group-hover:shadow-[0_0_35px_rgba(255,255,255,0.6)] transition-all cursor-pointer"
      >
        <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-600 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>
    </div>
  </motion.div>
);

export default AIAssistantCard;
