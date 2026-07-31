// src/components/notes/ShareNoteButton.jsx

import React from "react";

import {
  Share2,
} from "lucide-react";

const ShareNoteButton = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="
        group
        
        w-11
        h-11
        
        rounded-2xl
        
        bg-slate-50
        
        border
        border-slate-200
        
        flex
        items-center
        justify-center
        
        text-slate-600
        
        hover:border-orange-300
        hover:text-orange-500
        hover:bg-white
        
        transition-all
        duration-300
      "
    >
      
      {/* ICON */}
      <Share2
        size={18}
        className="
          group-hover:scale-110
          
          transition-transform
          duration-300
        "
      />
    </button>
  );
};

export default ShareNoteButton;