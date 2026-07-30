// src/components/packing/AddChecklistButton.jsx

import React from "react";

import {
  Plus,
} from "lucide-react";

const AddChecklistButton = () => {
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
        from-teal-500
        to-cyan-500
        
        text-white
        
        font-semibold
        
        shadow-[0_15px_35px_rgba(6,182,212,0.35)]
        
        hover:scale-[1.03]
        
        transition-all
        duration-300
      "
    >
      
      {/* ICON */}
      <Plus
        size={22}
        className="
          transition-transform
          duration-300
          
          group-hover:rotate-90
        "
      />

      {/* TEXT */}
      <span>
        Add Item
      </span>
    </button>
  );
};

export default AddChecklistButton;