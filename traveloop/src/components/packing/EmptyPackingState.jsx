// src/components/packing/EmptyPackingState.jsx

import React from "react";

import {
  Backpack,
  Sparkles,
  Plus,
} from "lucide-react";

const EmptyPackingState = () => {
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
        
        px-6
        md:px-10
        
        py-16
      "
    >
      
      {/* GLOW */}
      <div
        className="
          absolute
          top-[-120px]
          right-[-120px]
          
          w-[320px]
          h-[320px]
          
          rounded-full
          
          bg-cyan-200/20
          
          blur-3xl
        "
      />

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          
          flex
          flex-col
          items-center
          justify-center
          
          text-center
        "
      >
        
        {/* ICON */}
        <div
          className="
            flex
            items-center
            justify-center
            
            w-32
            h-32
            
            rounded-full
            
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            
            text-white
            
            shadow-[0_20px_50px_rgba(6,182,212,0.35)]
          "
        >
          <Backpack
            size={58}
          />
        </div>

        {/* BADGE */}
        <div
          className="
            mt-8
            
            flex
            items-center
            gap-2
            
            px-4
            py-2
            
            rounded-full
            
            bg-teal-50
            
            border
            border-teal-100
            
            text-teal-700
            
            text-sm
            
            font-semibold
          "
        >
          <Sparkles size={16} />

          <span>
            Smart Packing Assistant
          </span>
        </div>

        {/* TITLE */}
        <h2
          className="
            mt-6
            
            text-4xl
            md:text-5xl
            
            font-extrabold
            
            text-slate-900
            
            leading-tight
          "
        >
          No Packing Items Found
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-5
            
            max-w-3xl
            
            text-slate-500
            
            text-base
            md:text-lg
            
            leading-8
          "
        >
          Your packing checklist is currently
          empty. Start adding travel essentials,
          clothing, gadgets, and important
          documents to stay fully prepared
          for your adventure.
        </p>

        {/* BUTTON */}
        <button
          className="
            group
            
            mt-10
            
            flex
            items-center
            gap-3
            
            px-8
            py-5
            
            rounded-2xl
            
            bg-gradient-to-r
            from-teal-500
            to-cyan-500
            
            text-white
            
            font-semibold
            text-lg
            
            shadow-[0_15px_35px_rgba(6,182,212,0.35)]
            
            hover:scale-[1.03]
            
            transition-all
            duration-300
          "
        >
          
          {/* ICON */}
          <Plus
            size={24}
            className="
              transition-transform
              duration-300
              
              group-hover:rotate-90
            "
          />

          <span>
            Add Packing Item
          </span>
        </button>
      </div>
    </div>
  );
};

export default EmptyPackingState;