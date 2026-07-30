// src/components/itinerary/ItineraryHeader.jsx

import React from "react";

import {
  Route,
  Sparkles,
} from "lucide-react";

import BackButton from "../trip/BackButton";

// IMAGE
import BannerImage from "../../assets/images/itinerary-banner.jpg";

const ItineraryHeader = () => {
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
      "
    >
      
      {/* RIGHT SIDE BANNER */}
      <div
        className="
          absolute
          top-0
          right-0
          
          w-[45%]
          h-full
          
          hidden
          lg:block
          
          overflow-hidden
        "
      >
        <img
          src={BannerImage}
          alt="Itinerary Banner"
          className="
            w-full
            h-full
            
            object-cover
            
            opacity-95
          "
        />

        {/* OVERLAY */}
        <div
          className="
            absolute
            inset-0
            
            bg-gradient-to-l
            from-transparent
            via-white/30
            to-white
          "
        />
      </div>

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          
          flex
          flex-col
          lg:flex-row
          
          items-start
          lg:items-center
          
          justify-between
          
          gap-8
          
          px-6
          md:px-10
          
          py-10
        "
      >
        
        {/* LEFT SIDE */}
        <div
          className="
            flex
            items-start
            gap-5
          "
        >
          
          {/* BACK BUTTON */}
          <BackButton text="Back" />

          {/* TEXT */}
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
                Smart Itinerary Builder
              </span>
            </div>

            {/* TITLE */}
            <h1
              className="
                mt-5
                
                text-4xl
                md:text-5xl
                
                font-extrabold
                
                text-slate-800
                
                leading-tight
              "
            >
              Build Itinerary
            </h1>

            {/* SUBTITLE */}
            <p
              className="
                mt-4
                
                max-w-2xl
                
                text-base
                md:text-lg
                
                text-slate-500
                
                leading-8
              "
            >
              Organize your journey by adding
              sections, schedules, budgets,
              and activities for each part
              of your trip.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE STATS */}
        <div
          className="
            hidden
            xl:flex
            
            items-center
            gap-5
          "
        >
          
          {/* CARD 1 */}
          <div
            className="
              px-6
              py-5
              
              rounded-3xl
              
              bg-white/90
              backdrop-blur-xl
              
              border
              border-slate-200
              
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-12
                  h-12
                  
                  rounded-2xl
                  
                  bg-gradient-to-br
                  from-teal-500
                  to-cyan-500
                  
                  flex
                  items-center
                  justify-center
                  
                  text-white
                "
              >
                <Route size={22} />
              </div>

              <div>
                <h3
                  className="
                    text-3xl
                    
                    font-extrabold
                    
                    text-teal-600
                  "
                >
                  12
                </h3>

                <p
                  className="
                    text-sm
                    
                    text-slate-500
                  "
                >
                  Sections Planned
                </p>
              </div>
            </div>
          </div>

          {/* CARD 2 */}
          <div
            className="
              px-6
              py-5
              
              rounded-3xl
              
              bg-white/90
              backdrop-blur-xl
              
              border
              border-slate-200
              
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-12
                  h-12
                  
                  rounded-2xl
                  
                  bg-gradient-to-br
                  from-cyan-500
                  to-sky-500
                  
                  flex
                  items-center
                  justify-center
                  
                  text-white
                "
              >
                <Sparkles size={22} />
              </div>

              <div>
                <h3
                  className="
                    text-3xl
                    
                    font-extrabold
                    
                    text-cyan-600
                  "
                >
                  AI
                </h3>

                <p
                  className="
                    text-sm
                    
                    text-slate-500
                  "
                >
                  Smart Planning
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryHeader;