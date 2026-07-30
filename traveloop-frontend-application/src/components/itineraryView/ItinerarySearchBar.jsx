// src/components/itineraryView/ItinerarySearchBar.jsx

import React, { useState } from "react";

import {
  Search,
  MapPin,
  Sparkles,
} from "lucide-react";

const ItinerarySearchBar = () => {
  
  // STATES
  const [search, setSearch] =
    useState("");

  const [location, setLocation] =
    useState("");

  return (
    <div
      className="
        relative
        
        w-full
        
        flex
        flex-col
        lg:flex-row
        
        items-start
        lg:items-center
        
        gap-4
        
        px-5
        py-5
        
        rounded-[28px]
        
        border
        border-slate-200
        
        bg-white
        
        shadow-sm
        
        transition-all
        duration-300
        
        hover:border-teal-300
        
        focus-within:border-teal-500
        focus-within:ring-4
        focus-within:ring-teal-100
      "
    >
      
      {/* LEFT SIDE */}
      <div
        className="
          flex
          items-center
          gap-4
          
          flex-1
          
          w-full
        "
      >
        
        {/* SEARCH ICON */}
        <div
          className="
            flex
            items-center
            justify-center
            
            w-14
            h-14
            
            rounded-2xl
            
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            
            text-white
            
            shadow-md
            
            flex-shrink-0
          "
        >
          <Search
            className="
              w-6
              h-6
            "
          />
        </div>

        {/* INPUT AREA */}
        <div className="flex-1">
          
          {/* LABEL */}
          <div
            className="
              flex
              items-center
              gap-2
              
              mb-1
            "
          >
            <Sparkles
              size={14}
              className="
                text-teal-500
              "
            />

            <p
              className="
                text-xs
                md:text-sm
                
                text-slate-400
                
                font-semibold
                
                uppercase
                
                tracking-[2px]
              "
            >
              Search Itinerary
            </p>
          </div>

          {/* SEARCH INPUT */}
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search activities, hotels, transport..."
            className="
              w-full
              
              bg-transparent
              
              outline-none
              
              text-slate-900
              
              text-lg
              md:text-xl
              
              font-bold
              
              placeholder:text-slate-400
            "
          />
        </div>
      </div>

      {/* LOCATION */}
      <div
        className="
          w-full
          lg:w-auto
          
          flex
          items-center
          gap-3
          
          px-5
          py-4
          
          rounded-2xl
          
          bg-slate-100
          
          border
          border-slate-200
          
          min-w-[220px]
        "
      >
        
        {/* ICON */}
        <MapPin
          size={18}
          className="
            text-teal-500
          "
        />

        {/* INPUT */}
        <input
          type="text"
          value={location}
          onChange={(e) =>
            setLocation(
              e.target.value
            )
          }
          placeholder="Anywhere"
          className="
            w-full
            
            bg-transparent
            
            outline-none
            
            text-slate-700
            
            font-semibold
            
            placeholder:text-slate-400
          "
        />
      </div>
    </div>
  );
};

export default ItinerarySearchBar;