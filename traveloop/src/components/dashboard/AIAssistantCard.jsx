// src/components/dashboard/AIAssistantCard.jsx

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

const AIAssistantCard = ({ onOpen }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.35 }}
    className="mx-4 mb-4 rounded-[24px] overflow-hidden relative"
    style={{ background: "linear-gradient(135deg, #0F172A 0%, #14B8B5 100%)" }}
  >
    {/* Decorative blobs */}
    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-teal-400/10" />
    <div className="absolute top-4 right-20 w-12 h-12 rounded-full bg-white/5" />

    <div className="relative p-5 flex items-center gap-4">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
      >
        <Sparkles size={26} className="text-white" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
          AI Travel Assistant
        </p>
        <h3 className="text-white text-base font-bold leading-snug">
          Plan your perfect trip with AI
        </h3>
        <p className="text-white/60 text-xs mt-1">
          Itineraries · Budget tips · Packing lists
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.90 }}
        onClick={onOpen}
        className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <ArrowRight size={18} className="text-white" />
      </motion.button>
    </div>
  </motion.div>
);

export default AIAssistantCard;
