// src/components/myTrips/TripSearchBar.jsx

import React, { useState } from "react";

import {
  Search,
  MapPin,
} from "lucide-react";

const TripSearchBar = () => {
  
  // SEARCH STATE
  const [search, setSearch] =
    useState("");

  return (
    <div
      className="
        relative
        
        w-full
        
        flex
        items-center
        gap-4
        
        px-5
        py-4
        
        rounded-2xl
        
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
      
      {/* SEARCH ICON */}
      <div
        className="
          flex
          items-center
          justify-center
          
          w-12
          h-12
          
          rounded-2xl
          
          bg-gradient-to-br
          from-teal-500
          to-cyan-500
          
          text-white
          
          shadow-md
        "
      >
        <Search size={22} />
      </div>

      {/* INPUT SECTION */}
      <div className="flex-1">
        
        {/* LABEL */}
        <p
          className="
            text-xs
            md:text-sm
            
            text-slate-400
            
            font-medium
            
            mb-1
          "
        >
          Search Trips
        </p>

        {/* INPUT */}
        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search trips by name, destination..."
          className="
            w-full
            
            bg-transparent
            outline-none
            
            text-slate-800
            
            text-base
            md:text-lg
            
            font-semibold
            
            placeholder:text-slate-400
          "
        />
      </div>

      {/* LOCATION BADGE */}
      <div
        className="
          hidden
          lg:flex
          
          items-center
          gap-2
          
          px-4
          py-3
          
          rounded-xl
          
          bg-slate-100
          
          text-slate-600
          
          text-sm
          
          font-medium
        "
      >
        <MapPin size={18} />

        <span>
          All Destinations
        </span>
      </div>
    </div>
  );
};

export default TripSearchBar;