// src/components/notes/EditNoteButton.jsx

import React from "react";

import {
  Edit,
} from "lucide-react";

const EditNoteButton = ({
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
        
        hover:border-cyan-300
        hover:text-cyan-600
        hover:bg-white
        
        transition-all
        duration-300
      "
    >
      
      {/* ICON */}
      <Edit
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

export default EditNoteButton;