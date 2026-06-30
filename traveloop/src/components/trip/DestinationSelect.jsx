// src/components/trip/DestinationSelect.jsx

import React, { useState } from "react";

import {
  Search,
  MapPin,
  ChevronDown,
} from "lucide-react";

const DestinationSelect = ({
  label = "Select Destination",
  destinations = [],
  value,
  onChange,
  error = "",
}) => {
  
  // SEARCH STATE
  const [search, setSearch] = useState("");

  // FILTERED DESTINATIONS
  const filteredDestinations =
    destinations.filter((destination) =>
      destination
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <div className="w-full">
      
      {/* LABEL */}
      <label
        className="
          block
          mb-3
          
          text-sm
          md:text-base
          
          font-semibold
          
          text-slate-700
        "
      >
        {label}
      </label>

      {/* SEARCH BOX */}
      <div
        className="
          relative
          
          rounded-2xl
          
          border
          border-slate-200
          
          bg-white
          
          shadow-sm
          
          overflow-hidden
        "
      >
        
        {/* SEARCH INPUT */}
        <div
          className="
            flex
            items-center
            gap-4
            
            px-5
            py-4
            
            border-b
            border-slate-100
          "
        >
          
          {/* ICON */}
          <Search
            size={22}
            className="
              text-teal-500
            "
          />

          {/* INPUT */}
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search destinations..."
            className="
              w-full
              
              outline-none
              
              text-slate-700
              
              font-medium
              
              placeholder:text-slate-400
            "
          />
        </div>

        {/* SELECT */}
        <div
          className="
            max-h-[260px]
            
            overflow-y-auto
          "
        >
          {filteredDestinations.length > 0 ? (
            filteredDestinations.map(
              (destination, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    onChange({
                      target: {
                        name: "destination",
                        value: destination,
                      },
                    })
                  }
                  className={`
                    w-full
                    
                    flex
                    items-center
                    justify-between
                    
                    px-5
                    py-4
                    
                    text-left
                    
                    transition-all
                    duration-300
                    
                    hover:bg-teal-50
                    
                    ${
                      value === destination
                        ? "bg-teal-50"
                        : ""
                    }
                  `}
                >
                  
                  {/* LEFT */}
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <MapPin
                      size={20}
                      className="
                        text-teal-500
                      "
                    />

                    <span
                      className="
                        font-medium
                        
                        text-slate-700
                      "
                    >
                      {destination}
                    </span>
                  </div>

                  {/* CHECK */}
                  {value === destination && (
                    <ChevronDown
                      size={20}
                      className="
                        text-teal-600
                      "
                    />
                  )}
                </button>
              )
            )
          ) : (
            <div
              className="
                px-5
                py-6
                
                text-center
                
                text-slate-400
              "
            >
              No destinations found
            </div>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <p
          className="
            mt-2
            
            text-sm
            
            text-red-500
          "
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default DestinationSelect;