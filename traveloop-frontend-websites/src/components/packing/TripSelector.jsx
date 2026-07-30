// src/components/packing/TripSelector.jsx

import React, { useState } from "react";

import {
  Plane,
  ChevronDown,
  Sparkles,
} from "lucide-react";

const trips = [
  "Swiss Alps Adventure",
  "Bali Beach Escape",
  "Dubai Luxury Tour",
  "Goa Weekend Trip",
];

const TripSelector = () => {
  
  // SELECTED TRIP
  const [selectedTrip, setSelectedTrip] =
    useState(trips[0]);

  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        bg-gradient-to-r
        from-teal-500
        to-cyan-500
        
        rounded-[32px]
        
        shadow-[0_20px_50px_rgba(6,182,212,0.35)]
        
        p-6
      "
    >
      
      {/* GLOW */}
      <div
        className="
          absolute
          top-[-80px]
          right-[-80px]
          
          w-[220px]
          h-[220px]
          
          rounded-full
          
          bg-white/10
          
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
          lg:flex-row
          
          items-start
          lg:items-center
          
          justify-between
          
          gap-6
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
              
              bg-white/15
              
              border
              border-white/20
              
              text-white
              
              text-sm
              
              font-semibold
            "
          >
            <Sparkles size={16} />

            <span>
              Active Trip Checklist
            </span>
          </div>

          {/* TITLE */}
          <h2
            className="
              mt-5
              
              text-3xl
              md:text-4xl
              
              font-extrabold
              
              text-white
              
              leading-tight
            "
          >
            Select Your Trip
          </h2>

          {/* DESCRIPTION */}
          <p
            className="
              mt-4
              
              max-w-2xl
              
              text-white/80
              
              text-base
              md:text-lg
              
              leading-8
            "
          >
            Manage packing essentials
            separately for each of your
            planned travel adventures.
          </p>
        </div>

        {/* SELECTOR */}
        <div
          className="
            w-full
            lg:w-auto
          "
        >
          <div
            className="
              flex
              items-center
              gap-4
              
              px-5
              py-4
              
              rounded-3xl
              
              bg-white/15
              backdrop-blur-xl
              
              border
              border-white/20
              
              min-w-[320px]
            "
          >
            
            {/* ICON */}
            <div
              className="
                w-14
                h-14
                
                rounded-2xl
                
                bg-white/15
                
                flex
                items-center
                justify-center
                
                text-white
              "
            >
              <Plane size={24} />
            </div>

            {/* SELECT */}
            <div className="flex-1">
              
              <p
                className="
                  text-xs
                  
                  uppercase
                  
                  tracking-[2px]
                  
                  text-white/70
                  
                  font-semibold
                "
              >
                Current Trip
              </p>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  
                  mt-1
                "
              >
                <select
                  value={selectedTrip}
                  onChange={(e) =>
                    setSelectedTrip(
                      e.target.value
                    )
                  }
                  className="
                    bg-transparent
                    
                    outline-none
                    
                    text-white
                    
                    text-lg
                    
                    font-bold
                    
                    appearance-none
                    
                    cursor-pointer
                    
                    w-full
                  "
                >
                  {trips.map(
                    (trip, index) => (
                      <option
                        key={index}
                        value={trip}
                        className="
                          text-slate-900
                        "
                      >
                        {trip}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={18}
                  className="
                    text-white
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSelector;