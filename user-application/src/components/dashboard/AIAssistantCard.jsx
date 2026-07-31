// src/components/dashboard/AIAssistantCard.jsx

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

const AIAssistantCard = ({ onOpen }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.35 }}
    className="mx-4 mb-4 lg:mx-0 lg:mb-6 rounded-[24px] lg:rounded-2xl overflow-hidden relative"
    style={{ background: "linear-gradient(135deg, #0F172A 0%, #14B8B5 100%)" }}
  >
    {/* Decorative blobs */}
    <div className="absolute -top-8 -right-8 w-32 h-32 lg:w-48 lg:h-48 rounded-full bg-white/5" />
    <div className="absolute -bottom-6 -left-6 w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-teal-400/10" />
    <div className="absolute top-4 right-20 w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-white/5" />

    <div className="relative p-5 lg:p-8 flex items-center gap-4 lg:gap-6">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
      >
        <Sparkles size={26} className="lg:w-8 lg:h-8 text-white" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <p className="text-white/60 text-[11px] lg:text-sm font-semibold uppercase tracking-wider.mb-0.5">
          AI Travel Assistant
        </p>
        <h3 className="text-white text-base lg:text-xl font-bold leading-snug">
          Plan your perfect trip with AI
        </h3>
        <p className="text-white/60 text-xs lg:text-sm mt-1">
          Itineraries · Budget tips · Packing lists
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.90 }}
        onClick={onOpen}
        className="flex items-center justify-center w-10 h-10 lg:w-14 lg:h-14 rounded-full flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <ArrowRight size={18} className="lg:w-6 lg:h-6 text-white" />
      </motion.button>
    </div>
  </motion.div>
);

export default AIAssistantCard;
