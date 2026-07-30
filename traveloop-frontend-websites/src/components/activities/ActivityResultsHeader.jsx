// src/components/activities/ActivityResultsHeader.jsx

import React from "react";

import {
  Sparkles,
  Compass,
} from "lucide-react";

const ActivityResultsHeader = ({
  search = "Paragliding",
  count = 25,
}) => {
  return (
    <div
      className="
        flex
        flex-col
        lg:flex-row
        
        lg:items-end
        lg:justify-between
        
        gap-6
        
        mt-10
        mb-6
      "
    >
      
      {/* LEFT SIDE */}
      <div>
        
        {/* BADGE */}
        <div
          className="
            flex
            items-center
            gap-2
            
            w-fit
            
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
            Curated Adventure Experiences
          </span>
        </div>

        {/* TITLE */}
        <h2
          className="
            mt-5
            
            text-4xl
            md:text-5xl
            
            font-extrabold
            
            text-slate-900
            
            tracking-tight
            
            leading-tight
          "
        >
          Results for{" "}
          
          <span
            className="
              bg-gradient-to-r
              from-teal-500
              to-cyan-500
              
              bg-clip-text
              text-transparent
            "
          >
            “{search}”
          </span>
        </h2>

        {/* SUBTITLE */}
        <p
          className="
            mt-4
            
            text-base
            md:text-lg
            
            text-slate-500
            
            font-medium
            
            leading-8
          "
        >
          Discover top-rated activities,
          breathtaking locations, and unforgettable
          experiences from around the world.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div
        className="
          flex
          items-center
          gap-4
          
          px-6
          py-5
          
          rounded-3xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        
        {/* ICON */}
        <div
          className="
            w-14
            h-14
            
            rounded-2xl
            
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            
            text-white
            
            flex
            items-center
            justify-center
            
            shadow-lg
          "
        >
          <Compass size={28} />
        </div>

        {/* TEXT */}
        <div>
          <h3
            className="
              text-3xl
              
              font-extrabold
              
              text-slate-900
            "
          >
            {count}+
          </h3>

          <p
            className="
              text-sm
              
              text-slate-500
              
              font-medium
            "
          >
            Activities Found
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityResultsHeader;