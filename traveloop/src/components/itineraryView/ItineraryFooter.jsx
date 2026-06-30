// src/components/itineraryView/ItineraryFooter.jsx

import React from "react";

import {
  Sparkles,
  Save,
  Share2,
  ArrowRight,
} from "lucide-react";

const ItineraryFooter = () => {
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
        
        py-8
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
          xl:flex-row
          
          items-start
          xl:items-center
          
          justify-between
          
          gap-8
        "
      >
        
        {/* LEFT */}
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
              AI Optimized Travel Plan
            </span>
          </div>

          {/* TITLE */}
          <h2
            className="
              mt-5
              
              text-3xl
              md:text-4xl
              
              font-extrabold
              
              text-slate-900
              
              leading-tight
            "
          >
            Your Itinerary Is Ready ✈️
          </h2>

          {/* DESCRIPTION */}
          <p
            className="
              mt-4
              
              max-w-3xl
              
              text-slate-500
              
              text-base
              md:text-lg
              
              leading-8
            "
          >
            Save your personalized itinerary,
            share it with your travel companions,
            and continue planning unforgettable
            adventures with ease.
          </p>
        </div>

        {/* BUTTONS */}
        <div
          className="
            flex
            flex-col
            sm:flex-row
            
            items-center
            
            gap-4
            
            w-full
            xl:w-auto
          "
        >
          
          {/* SHARE */}
          <button
            className="
              group
              
              w-full
              sm:w-auto
              
              flex
              items-center
              justify-center
              gap-3
              
              px-7
              py-4
              
              rounded-2xl
              
              bg-white
              
              border
              border-slate-200
              
              text-slate-700
              
              font-semibold
              
              shadow-sm
              
              hover:border-cyan-300
              hover:text-cyan-600
              hover:shadow-md
              
              transition-all
              duration-300
            "
          >
            <Share2
              size={20}
              className="
                transition-transform
                duration-300
                
                group-hover:scale-110
              "
            />

            <span>
              Share Itinerary
            </span>
          </button>

          {/* SAVE */}
          <button
            className="
              group
              
              w-full
              sm:w-auto
              
              flex
              items-center
              justify-center
              gap-3
              
              px-8
              py-4
              
              rounded-2xl
              
              bg-gradient-to-r
              from-teal-500
              to-cyan-500
              
              text-white
              
              font-semibold
              
              shadow-[0_15px_35px_rgba(6,182,212,0.35)]
              
              hover:scale-[1.03]
              
              transition-all
              duration-300
            "
          >
            <Save
              size={20}
              className="
                transition-transform
                duration-300
                
                group-hover:scale-110
              "
            />

            <span>
              Save Itinerary
            </span>

            <ArrowRight
              size={18}
              className="
                transition-transform
                duration-300
                
                group-hover:translate-x-1
              "
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryFooter;