// src/components/itinerary/SectionToolbar.jsx

import React, { useState } from "react";

import {
  Pencil,
  Trash2,
  Copy,
  MoreVertical,
} from "lucide-react";

const SectionToolbar = ({
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  
  // MENU STATE
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      
      {/* MENU BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="
          group
          
          w-14
          h-14
          
          rounded-2xl
          
          bg-white
          
          border
          border-slate-200
          
          flex
          items-center
          justify-center
          
          shadow-sm
          
          hover:border-teal-300
          hover:shadow-md
          
          transition-all
          duration-300
        "
      >
        <MoreVertical
          size={22}
          className="
            text-slate-700
            
            transition-transform
            duration-300
            
            group-hover:scale-110
          "
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute
            right-0
            top-[72px]
            
            w-[240px]
            
            rounded-3xl
            
            bg-white/95
            backdrop-blur-xl
            
            border
            border-slate-200
            
            shadow-[0_20px_60px_rgba(15,23,42,0.15)]
            
            overflow-hidden
            
            z-50
          "
        >
          
          {/* MENU ITEMS */}
          <div className="p-3">
            
            {/* EDIT */}
            <button
              onClick={onEdit}
              className="
                w-full
                
                flex
                items-center
                gap-4
                
                px-4
                py-4
                
                rounded-2xl
                
                text-slate-700
                
                hover:bg-slate-100
                hover:text-teal-600
                
                transition-all
                duration-300
              "
            >
              
              {/* ICON */}
              <div
                className="
                  w-11
                  h-11
                  
                  rounded-xl
                  
                  bg-slate-100
                  
                  flex
                  items-center
                  justify-center
                "
              >
                <Pencil size={20} />
              </div>

              {/* TEXT */}
              <span className="font-medium">
                Edit Section
              </span>
            </button>

            {/* DUPLICATE */}
            <button
              onClick={onDuplicate}
              className="
                w-full
                
                flex
                items-center
                gap-4
                
                px-4
                py-4
                
                rounded-2xl
                
                text-slate-700
                
                hover:bg-slate-100
                hover:text-cyan-600
                
                transition-all
                duration-300
              "
            >
              
              {/* ICON */}
              <div
                className="
                  w-11
                  h-11
                  
                  rounded-xl
                  
                  bg-slate-100
                  
                  flex
                  items-center
                  justify-center
                "
              >
                <Copy size={20} />
              </div>

              {/* TEXT */}
              <span className="font-medium">
                Duplicate Section
              </span>
            </button>

            {/* DELETE */}
            <button
              onClick={onDelete}
              className="
                w-full
                
                flex
                items-center
                gap-4
                
                px-4
                py-4
                
                rounded-2xl
                
                text-red-500
                
                hover:bg-red-50
                
                transition-all
                duration-300
              "
            >
              
              {/* ICON */}
              <div
                className="
                  w-11
                  h-11
                  
                  rounded-xl
                  
                  bg-red-50
                  
                  flex
                  items-center
                  justify-center
                "
              >
                <Trash2 size={20} />
              </div>

              {/* TEXT */}
              <span className="font-medium">
                Delete Section
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionToolbar;