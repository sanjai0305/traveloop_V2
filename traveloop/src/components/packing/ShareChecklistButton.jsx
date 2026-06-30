// src/components/packing/ShareChecklistButton.jsx

import React from "react";

import {
  Share2,
  ArrowRight,
} from "lucide-react";

const ShareChecklistButton = () => {
  return (
    <button
      className="
        group
        
        flex
        items-center
        gap-3
        
        px-7
        py-4
        
        rounded-2xl
        
        bg-gradient-to-r
        from-cyan-500
        to-sky-500
        
        text-white
        
        font-semibold
        
        shadow-[0_15px_35px_rgba(14,165,233,0.35)]
        
        hover:scale-[1.03]
        
        transition-all
        duration-300
      "
    >
      
      {/* ICON */}
      <Share2
        size={22}
        className="
          transition-transform
          duration-300
          
          group-hover:scale-110
        "
      />

      {/* TEXT */}
      <span>
        Share Checklist
      </span>

      {/* ARROW */}
      <ArrowRight
        size={18}
        className="
          transition-transform
          duration-300
          
          group-hover:translate-x-1
        "
      />
    </button>
  );
};

export default ShareChecklistButton;