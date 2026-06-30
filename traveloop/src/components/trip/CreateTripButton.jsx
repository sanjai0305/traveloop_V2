// src/components/trip/CreateTripButton.jsx

import React from "react";

import {
  Plane,
  ArrowRight,
} from "lucide-react";

const CreateTripButton = ({
  text = "Create Trip",
  loading = false,
  onClick,
  fullWidth = true,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`
        group
        relative
        
        ${
          fullWidth
            ? "w-full"
            : "w-auto"
        }
        
        flex
        items-center
        justify-center
        gap-3
        
        px-8
        py-4
        
        rounded-2xl
        
        bg-gradient-to-r
        from-teal-500
        via-cyan-500
        to-sky-500
        
        text-white
        
        font-semibold
        text-base
        md:text-lg
        
        shadow-[0_15px_35px_rgba(6,182,212,0.35)]
        
        overflow-hidden
        
        transition-all
        duration-300
        
        hover:scale-[1.02]
        hover:shadow-[0_20px_45px_rgba(6,182,212,0.45)]
        
        active:scale-[0.98]
        
        disabled:opacity-60
        disabled:cursor-not-allowed
      `}
    >
      
      {/* BACKGROUND GLOW */}
      <div
        className="
          absolute
          inset-0
          
          bg-white/10
          
          opacity-0
          group-hover:opacity-100
          
          transition
          duration-500
        "
      />

      {/* LOADING */}
      {loading ? (
        <div
          className="
            relative
            z-10
            
            flex
            items-center
            gap-3
          "
        >
          
          {/* SPINNER */}
          <div
            className="
              w-5
              h-5
              
              border-2
              border-white
              border-t-transparent
              
              rounded-full
              
              animate-spin
            "
          />

          <span>
            Creating Trip...
          </span>
        </div>
      ) : (
        <>
          
          {/* ICON */}
          <Plane
            size={22}
            className="
              relative
              z-10
              
              rotate-[20deg]
              
              transition-transform
              duration-300
              
              group-hover:translate-x-1
            "
          />

          {/* TEXT */}
          <span className="relative z-10">
            {text}
          </span>

          {/* ARROW */}
          <ArrowRight
            size={20}
            className="
              relative
              z-10
              
              transition-transform
              duration-300
              
              group-hover:translate-x-1
            "
          />
        </>
      )}
    </button>
  );
};

export default CreateTripButton;