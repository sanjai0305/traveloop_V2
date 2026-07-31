// src/components/itinerary/EmptySectionState.jsx

import React from "react";

import {
  Plus,
  Sparkles,
  Route,
} from "lucide-react";

// IMAGE
import EmptyStateImage from "../../assets/images/empty-state.png";

const EmptySectionState = ({
  onAddSection,
}) => {
  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        rounded-[36px]
        
        bg-white
        
        border
        border-slate-200
        
        shadow-sm
        
        px-6
        md:px-10
        
        py-14
      "
    >
      
      {/* TOP GLOW */}
      <div
        className="
          absolute
          top-[-100px]
          right-[-100px]
          
          w-72
          h-72
          
          bg-cyan-200/20
          
          rounded-full
          
          blur-3xl
        "
      />

      {/* BOTTOM GLOW */}
      <div
        className="
          absolute
          bottom-[-100px]
          left-[-100px]
          
          w-72
          h-72
          
          bg-teal-200/20
          
          rounded-full
          
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
        
        {/* IMAGE */}
        <div
          className="
            relative
            
            w-full
            max-w-[420px]
          "
        >
          <img
            src={EmptyStateImage}
            alt="Empty State"
            className="
              w-full
              object-contain
            "
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
            AI Powered Itinerary Builder
          </span>
        </div>

        {/* TITLE */}
        <h2
          className="
            mt-6
            
            text-3xl
            md:text-5xl
            
            font-extrabold
            
            text-slate-800
            
            leading-tight
          "
        >
          No Sections Added Yet
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-5
            
            max-w-2xl
            
            text-slate-500
            
            text-base
            md:text-lg
            
            leading-8
          "
        >
          Start building your perfect travel
          itinerary by creating sections for
          destinations, activities, schedules,
          accommodations, and experiences.
        </p>

        {/* STATS */}
        <div
          className="
            flex
            flex-wrap
            
            items-center
            justify-center
            
            gap-5
            
            mt-10
          "
        >
          
          {/* CARD 1 */}
          <div
            className="
              flex
              items-center
              gap-4
              
              px-5
              py-4
              
              rounded-3xl
              
              bg-white
              
              border
              border-slate-200
              
              shadow-sm
            "
          >
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
              "
            >
              <Route size={24} />
            </div>

            <div className="text-left">
              <h3
                className="
                  text-2xl
                  
                  font-bold
                  
                  text-slate-800
                "
              >
                Unlimited
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Travel Sections
              </p>
            </div>
          </div>

          {/* CARD 2 */}
          <div
            className="
              flex
              items-center
              gap-4
              
              px-5
              py-4
              
              rounded-3xl
              
              bg-white
              
              border
              border-slate-200
              
              shadow-sm
            "
          >
            <div
              className="
                w-14
                h-14
                
                rounded-2xl
                
                bg-gradient-to-br
                from-cyan-500
                to-sky-500
                
                text-white
                
                flex
                items-center
                justify-center
              "
            >
              <Sparkles size={24} />
            </div>

            <div className="text-left">
              <h3
                className="
                  text-2xl
                  
                  font-bold
                  
                  text-slate-800
                "
              >
                Smart
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                AI Recommendations
              </p>
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={onAddSection}
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
            hover:shadow-[0_20px_45px_rgba(6,182,212,0.45)]
            
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
            Add First Section
          </span>
        </button>
      </div>
    </div>
  );
};

export default EmptySectionState;