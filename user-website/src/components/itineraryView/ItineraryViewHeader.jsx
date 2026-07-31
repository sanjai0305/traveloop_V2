// src/components/itineraryView/ItineraryViewHeader.jsx

import React from "react";

import {
  MapPin,
  CalendarDays,
  Sparkles,
} from "lucide-react";

const ItineraryViewHeader = () => {
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
      
      {/* TOP GLOW */}
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
      <div className="relative z-10">
        
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
            Smart Itinerary Planner
          </span>
        </div>

        {/* TITLE */}
        <h1
          className="
            mt-5
            
            text-4xl
            md:text-5xl
            
            font-extrabold
            
            text-slate-900
            
            leading-tight
          "
        >
          Itinerary For{" "}
          
          <span
            className="
              bg-gradient-to-r
              from-teal-500
              to-cyan-500
              
              bg-clip-text
              text-transparent
            "
          >
            Swiss Alps Adventure
          </span>
        </h1>

        {/* SUBTITLE */}
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
          Organize and manage your travel
          activities, schedules, transportation,
          stays, and expenses with a beautiful
          timeline-based itinerary view.
        </p>

        {/* META */}
        <div
          className="
            flex
            flex-wrap
            
            items-center
            
            gap-5
            
            mt-8
          "
        >
          
          {/* LOCATION */}
          <div
            className="
              flex
              items-center
              gap-3
              
              px-5
              py-4
              
              rounded-2xl
              
              bg-white
              
              border
              border-slate-200
              
              shadow-sm
            "
          >
            
            {/* ICON */}
            <div
              className="
                w-12
                h-12
                
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
              <MapPin size={22} />
            </div>

            {/* TEXT */}
            <div>
              <p
                className="
                  text-xs
                  
                  uppercase
                  
                  tracking-[2px]
                  
                  text-slate-400
                  
                  font-semibold
                "
              >
                Destination
              </p>

              <h4
                className="
                  text-slate-800
                  
                  font-bold
                  
                  text-base
                "
              >
                Switzerland
              </h4>
            </div>
          </div>

          {/* DATE */}
          <div
            className="
              flex
              items-center
              gap-3
              
              px-5
              py-4
              
              rounded-2xl
              
              bg-white
              
              border
              border-slate-200
              
              shadow-sm
            "
          >
            
            {/* ICON */}
            <div
              className="
                w-12
                h-12
                
                rounded-2xl
                
                bg-gradient-to-br
                from-orange-400
                to-pink-500
                
                text-white
                
                flex
                items-center
                justify-center
              "
            >
              <CalendarDays size={22} />
            </div>

            {/* TEXT */}
            <div>
              <p
                className="
                  text-xs
                  
                  uppercase
                  
                  tracking-[2px]
                  
                  text-slate-400
                  
                  font-semibold
                "
              >
                Travel Dates
              </p>

              <h4
                className="
                  text-slate-800
                  
                  font-bold
                  
                  text-base
                "
              >
                10 May - 17 May 2026
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryViewHeader;