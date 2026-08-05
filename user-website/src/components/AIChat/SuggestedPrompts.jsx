// src/components/AIChat/SuggestedPrompts.jsx
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Map, Wallet, Users, Mountain, Palmtree, Compass, BookmarkCheck } from "lucide-react";

export const SUGGESTED_PROMPTS = [
  { icon: Map,           label: "Plan my trip",         prompt: "Can you plan a 4-day travel itinerary for me?" },
  { icon: Compass,       label: "Suggest weekend trips",prompt: "Suggest the best weekend getaway trips near my location" },
  { icon: Wallet,        label: "Budget travel ideas", prompt: "Give me budget travel ideas under ₹5,000 per person" },
  { icon: Users,         label: "Family vacation",     prompt: "Recommend family-friendly holiday destinations and packages" },
  { icon: Mountain,      label: "Adventure trips",     prompt: "Show me top adventure trips for paragliding, trekking, and rafting" },
  { icon: Mountain,      label: "Hill stations",       prompt: "What are the best hill stations to visit this season?" },
  { icon: Palmtree,      label: "Beach destinations",  prompt: "Recommend stunning beach destinations with resort packages" },
  { icon: BookmarkCheck, label: "Book my trip",        prompt: "Show me available group trips ready to book right now" },
];

export const SuggestedPrompts = ({ onSelect, disabled }) => {
  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <Sparkles size={12} className="text-teal-500" />
        <span>Suggested Prompts</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SUGGESTED_PROMPTS.map((sp) => {
          const Icon = sp.icon;
          return (
            <motion.button
              key={sp.label}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              disabled={disabled}
              onClick={() => onSelect(sp.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-teal-400 dark:hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all flex-shrink-0 shadow-2xs disabled:opacity-50"
            >
              <Icon size={12} className="text-teal-500 flex-shrink-0" />
              <span>{sp.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedPrompts;
