// src/components/activities/ActivityButton.jsx

import React from "react";

import {
  ArrowRight,
  CalendarDays,
} from "lucide-react";

const ActivityButton = ({
  text = "View Details",
  onClick,
  fullWidth = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        group
        relative
        
        overflow-hidden
        
        ${
          fullWidth
            ? "w-full"
            : "w-auto"
        }
        
        flex
        items-center
        justify-center
        gap-3
        
        px-7
        py-4
        
        rounded-2xl
        
        bg-gradient-to-r
        from-teal-500
        to-cyan-500
        
        text-white
        
        font-semibold
        text-base
        
        shadow-[0_15px_35px_rgba(6,182,212,0.35)]
        
        hover:scale-[1.03]
        hover:shadow-[0_20px_45px_rgba(6,182,212,0.45)]
        
        active:scale-[0.98]
        
        transition-all
        duration-300
      `}
    >
      
      {/* GLOW EFFECT */}
      <div
        className="
          absolute
          inset-0
          
          bg-white/10
          
          opacity-0
          group-hover:opacity-100
          
          transition
          duration-500
        "
      />

      {/* ICON */}
      <CalendarDays
        size={20}
        className="
          relative
          z-10
          
          transition-transform
          duration-300
          
          group-hover:scale-110
        "
      />

      {/* TEXT */}
      <span className="relative z-10">
        {text}
      </span>

      {/* ARROW */}
      <ArrowRight
        size={18}
        className="
          relative
          z-10
          
          transition-transform
          duration-300
          
          group-hover:translate-x-1
        "
      />
    </button>
  );
};

export default ActivityButton;