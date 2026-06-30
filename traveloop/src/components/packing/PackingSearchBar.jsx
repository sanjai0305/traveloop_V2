// src/components/packing/PackingSearchBar.jsx

import React, { useState } from "react";

import {
  Search,
  Sparkles,
  Backpack,
} from "lucide-react";

const PackingSearchBar = () => {
  
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
            Search Packing Items
          </p>
        </div>

        {/* INPUT */}
        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search passports, chargers, clothes..."
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

      {/* RIGHT BADGE */}
      <div
        className="
          hidden
          lg:flex
          
          items-center
          gap-3
          
          px-5
          py-4
          
          rounded-2xl
          
          bg-slate-100
          
          border
          border-slate-200
          
          min-w-[200px]
        "
      >
        
        {/* ICON */}
        <Backpack
          size={18}
          className="
            text-teal-500
          "
        />

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
            Packing Status
          </p>

          <h4
            className="
              text-slate-800
              
              font-bold
              
              text-base
            "
          >
            5 / 12 Packed
          </h4>
        </div>
      </div>
    </div>
  );
};

export default PackingSearchBar;