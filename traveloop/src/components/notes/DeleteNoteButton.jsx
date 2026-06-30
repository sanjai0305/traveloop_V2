// src/components/notes/DeleteNoteButton.jsx

import React from "react";

import {
  Trash2,
} from "lucide-react";

const DeleteNoteButton = ({
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
        
        text-red-500
        
        hover:bg-red-50
        hover:border-red-300
        
        transition-all
        duration-300
      "
    >
      
      {/* ICON */}
      <Trash2
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

export default DeleteNoteButton;