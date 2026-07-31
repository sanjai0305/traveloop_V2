// src/components/notes/NoteCard.jsx

import React from "react";

import {
  Calendar,
  MapPin,
  Star,
} from "lucide-react";

// COMPONENTS
import NoteMetaInfo from "./NoteMetaInfo";
import NoteActions from "./NoteActions";

const NoteCard = ({ note }) => {
  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        bg-white
        
        border
        border-slate-200
        
        rounded-[36px]
        
        shadow-sm
        
        hover:shadow-xl
        
        transition-all
        duration-300
      "
    >
      
      {/* IMAGE HEADER */}
      <div
        className="
          relative
          
          h-[220px]
          
          w-full
        "
      >
        <img
          src={note.image}
          alt={note.title}
          className="
            w-full
            h-full
            
            object-cover
          "
        />

        {/* IMPORTANT BADGE */}
        {note.isImportant && (
          <div
            className="
              absolute
              top-5
              right-5
              
              flex
              items-center
              gap-2
              
              px-4
              py-2
              
              rounded-full
              
              bg-red-500/90
              
              text-white
              
              text-sm
              
              font-bold
              
              shadow-lg
            "
          >
            <Star size={16} />

            <span>
              Important
            </span>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div
        className="
          p-7
        "
      >
        
        {/* CATEGORY */}
        <div
          className="
            flex
            items-center
            gap-2
            
            text-sm
            
            font-semibold
            
            text-teal-600
          "
        >
          <MapPin size={16} />

          <span>
            {note.category}
          </span>
        </div>

        {/* TITLE */}
        <h2
          className="
            mt-4
            
            text-2xl
            
            font-extrabold
            
            text-slate-900
          "
        >
          {note.title}
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-3
            
            text-slate-500
            
            text-base
            
            leading-7
          "
        >
          {note.description}
        </p>

        {/* META INFO */}
        <div
          className="
            mt-6
          "
        >
          <NoteMetaInfo
            date={note.date}
          />
        </div>

        {/* ACTIONS */}
        <div
          className="
            mt-6
            
            flex
            items-center
            justify-between
          "
        >
          <NoteActions />
        </div>
      </div>
    </div>
  );
};

export default NoteCard;