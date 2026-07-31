// src/components/packing/PackingChecklistItem.jsx

import React, { useState } from "react";

import {
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
} from "lucide-react";

const PackingChecklistItem = ({
  item,
}) => {
  
  // CHECK STATE
  const [checked, setChecked] =
    useState(item.packed);

  return (
    <div
      className={`
        group
        
        flex
        flex-col
        lg:flex-row
        
        items-start
        lg:items-center
        
        justify-between
        
        gap-5
        
        p-5
        
        rounded-[30px]
        
        border
        
        transition-all
        duration-300
        
        ${
          checked
            ? `
              bg-emerald-50
              border-emerald-100
            `
            : `
              bg-white
              border-slate-200
              
              hover:border-teal-300
              hover:shadow-md
            `
        }
      `}
    >
      
      {/* LEFT */}
      <div
        className="
          flex
          items-center
          gap-5
        "
      >
        
        {/* CHECKBOX */}
        <button
          onClick={() =>
            setChecked(!checked)
          }
          className="
            transition-transform
            duration-300
            
            hover:scale-110
          "
        >
          {checked ? (
            <CheckCircle2
              size={32}
              className="
                text-emerald-500
              "
            />
          ) : (
            <Circle
              size={32}
              className="
                text-slate-300
              "
            />
          )}
        </button>

        {/* TEXT */}
        <div>
          
          {/* LABEL */}
          <h3
            className={`
              text-xl
              
              font-bold
              
              transition-all
              duration-300
              
              ${
                checked
                  ? `
                    text-emerald-600
                    line-through
                  `
                  : `
                    text-slate-900
                  `
              }
            `}
          >
            {item.label}
          </h3>

          {/* STATUS */}
          <p
            className={`
              mt-2
              
              text-sm
              
              font-medium
              
              ${
                checked
                  ? `
                    text-emerald-500
                  `
                  : `
                    text-slate-500
                  `
              }
            `}
          >
            {checked
              ? "Packed Successfully"
              : "Pending Packing"}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        
        {/* EDIT */}
        <button
          className="
            w-12
            h-12
            
            rounded-2xl
            
            bg-white
            
            border
            border-slate-200
            
            flex
            items-center
            justify-center
            
            text-slate-600
            
            shadow-sm
            
            hover:border-teal-300
            hover:text-teal-600
            
            transition-all
            duration-300
          "
        >
          <Pencil size={18} />
        </button>

        {/* DELETE */}
        <button
          className="
            w-12
            h-12
            
            rounded-2xl
            
            bg-white
            
            border
            border-slate-200
            
            flex
            items-center
            justify-center
            
            text-red-500
            
            shadow-sm
            
            hover:border-red-300
            hover:bg-red-50
            
            transition-all
            duration-300
          "
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default PackingChecklistItem;