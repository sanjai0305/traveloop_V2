// src/components/notes/AddNoteButton.jsx

import React from "react";

import {
  Plus,
  NotebookPen,
} from "lucide-react";

const AddNoteButton = () => {
  return (
    <div
      className="
        w-full
        
        flex
        items-center
        justify-center
      "
    >
      <button
        className="
          group
          
          flex
          items-center
          gap-4
          
          px-10
          py-6
          
          rounded-3xl
          
          bg-gradient-to-r
          from-teal-500
          to-cyan-500
          
          text-white
          
          font-bold
          text-lg
          
          shadow-[0_20px_50px_rgba(6,182,212,0.35)]
          
          hover:scale-[1.03]
          active:scale-[0.98]
          
          transition-all
          duration-300
        "
      >
        
        {/* ICON WRAPPER */}
        <div
          className="
            w-12
            h-12
            
            rounded-2xl
            
            bg-white/15
            
            flex
            items-center
            justify-center
            
            group-hover:rotate-12
            
            transition-transform
            duration-300
          "
        >
          <Plus size={24} />
        </div>

        {/* TEXT */}
        <div className="flex flex-col text-left">
          <span>
            Add New Note
          </span>

          <span
            className="
              text-sm
              
              text-white/80
              
              font-medium
            "
          >
            Save travel reminders & ideas
          </span>
        </div>

        {/* RIGHT ICON */}
        <NotebookPen
          size={24}
          className="
            opacity-80
            
            group-hover:translate-x-1
            
            transition-transform
            duration-300
          "
        />
      </button>
    </div>
  );
};

export default AddNoteButton;