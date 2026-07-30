// src/components/community/CommunityActionButton.jsx

import React from "react";

import {
  ArrowRight,
  Users,
} from "lucide-react";

const CommunityActionButton = ({
  text = "Join Community",
}) => {
  return (
    <button
      className="
        group
        
        relative
        
        overflow-hidden
        
        flex
        items-center
        gap-3
        
        px-7
        py-4
        
        rounded-2xl
        
        bg-gradient-to-r
        from-teal-500
        to-cyan-500
        
        text-white
        
        font-semibold
        
        shadow-[0_15px_35px_rgba(6,182,212,0.35)]
        
        hover:scale-[1.03]
        hover:shadow-[0_20px_45px_rgba(6,182,212,0.45)]
        
        transition-all
        duration-300
      "
    >
      
      {/* GLOW */}
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
      <div
        className="
          relative
          z-10
          
          flex
          items-center
          justify-center
          
          w-10
          h-10
          
          rounded-xl
          
          bg-white/15
        "
      >
        <Users size={18} />
      </div>

      {/* TEXT */}
      <span
        className="
          relative
          z-10
        "
      >
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

export default CommunityActionButton;