// src/components/dashboard/SectionHeader.jsx

import React from "react";

import {
  ArrowRight,
} from "lucide-react";

const SectionHeader = ({
  title = "Section Title",
  subtitle = "",
  buttonText = "View All",
  onClick,
  showButton = true,
}) => {
  return (
    <div
      className="
        flex
        flex-col
        md:flex-row
        
        md:items-center
        md:justify-between
        
        gap-4
        
        mb-7
      "
    >
      
      {/* LEFT CONTENT */}
      <div>
        
        {/* TITLE */}
        <h2
          className="
            text-2xl
            md:text-3xl
            
            font-extrabold
            
            text-slate-800
            
            leading-tight
          "
        >
          {title}
        </h2>

        {/* SUBTITLE */}
        {subtitle && (
          <p
            className="
              mt-2
              
              text-slate-500
              
              text-sm
              md:text-base
              
              leading-7
            "
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* RIGHT BUTTON */}
      {showButton && (
        <button
          onClick={onClick}
          className="
            group
            
            flex
            items-center
            gap-2
            
            w-fit
            
            px-5
            py-3
            
            rounded-2xl
            
            bg-white
            
            border
            border-slate-200
            
            text-slate-700
            
            font-semibold
            
            shadow-sm
            
            hover:border-teal-300
            hover:text-teal-600
            hover:shadow-md
            
            transition-all
            duration-300
          "
        >
          
          {/* BUTTON TEXT */}
          <span>
            {buttonText}
          </span>

          {/* ICON */}
          <ArrowRight
            size={18}
            className="
              transition-transform
              duration-300
              
              group-hover:translate-x-1
            "
          />
        </button>
      )}
    </div>
  );
};

export default SectionHeader;