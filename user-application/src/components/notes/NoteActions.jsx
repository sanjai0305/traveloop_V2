// src/components/notes/NoteActions.jsx

import React from "react";

import {
  Edit,
  Trash2,
  Share2,
  Eye,
} from "lucide-react";

const NoteActions = () => {
  return (
    <div
      className="
        flex
        items-center
        gap-3
      "
    >
      
      {/* VIEW */}
      <button
        className="
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
          
          hover:border-teal-300
          hover:text-teal-600
          hover:bg-white
          
          transition-all
          duration-300
        "
      >
        <Eye size={18} />
      </button>

      {/* EDIT */}
      <button
        className="
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
        <Edit size={18} />
      </button>

      {/* SHARE */}
      <button
        className="
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
        <Share2 size={18} />
      </button>

      {/* DELETE */}
      <button
        className="
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
          
          hover:border-red-300
          hover:bg-red-50
          
          transition-all
          duration-300
        "
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default NoteActions;