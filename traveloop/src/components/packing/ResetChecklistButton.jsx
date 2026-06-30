// src/components/packing/ResetChecklistButton.jsx

import React from "react";

import {
  RotateCcw,
} from "lucide-react";

const ResetChecklistButton = () => {
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
        
        bg-white
        
        border
        border-slate-200
        
        text-slate-700
        
        font-semibold
        
        shadow-sm
        
        hover:border-orange-300
        hover:text-orange-500
        hover:bg-orange-50
        
        transition-all
        duration-300
      "
    >
      
      {/* ICON */}
      <RotateCcw
        size={22}
        className="
          transition-transform
          duration-500
          
          group-hover:-rotate-180
        "
      />

      {/* TEXT */}
      <span>
        Reset
      </span>
    </button>
  );
};

export default ResetChecklistButton;