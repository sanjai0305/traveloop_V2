// src/components/myTrips/TripFilterBar.jsx

import React, { useState } from "react";

import {
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  ChevronDown,
} from "lucide-react";

const TripFilterBar = () => {
  
  // STATES
  const [groupBy, setGroupBy] =
    useState("Status");

  const [sortBy, setSortBy] =
    useState("Latest");

  return (
    <div
      className="
        flex
        flex-wrap
        
        items-center
        
        gap-4
      "
    >
      
      {/* GROUP BY */}
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
          
          hover:border-teal-300
          
          transition-all
          duration-300
        "
      >
        
        {/* ICON */}
        <div
          className="
            w-11
            h-11
            
            rounded-xl
            
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            
            text-white
            
            flex
            items-center
            justify-center
            
            shadow-md
          "
        >
          <SlidersHorizontal size={20} />
        </div>

        {/* CONTENT */}
        <div>
          <p
            className="
              text-xs
              
              text-slate-400
              
              font-medium
            "
          >
            Group By
          </p>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <select
              value={groupBy}
              onChange={(e) =>
                setGroupBy(e.target.value)
              }
              className="
                bg-transparent
                outline-none
                
                text-slate-700
                
                font-semibold
                
                appearance-none
                
                cursor-pointer
              "
            >
              <option>
                Status
              </option>

              <option>
                Destination
              </option>

              <option>
                Date
              </option>

              <option>
                Budget
              </option>
            </select>

            <ChevronDown
              size={18}
              className="
                text-slate-500
              "
            />
          </div>
        </div>
      </div>

      {/* FILTER */}
      <button
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
          
          hover:border-cyan-300
          hover:shadow-md
          
          transition-all
          duration-300
        "
      >
        
        {/* ICON */}
        <div
          className="
            w-11
            h-11
            
            rounded-xl
            
            bg-gradient-to-br
            from-cyan-500
            to-sky-500
            
            text-white
            
            flex
            items-center
            justify-center
            
            shadow-md
          "
        >
          <Filter size={20} />
        </div>

        {/* TEXT */}
        <div className="text-left">
          <p
            className="
              text-xs
              
              text-slate-400
              
              font-medium
            "
          >
            Advanced
          </p>

          <h4
            className="
              text-slate-700
              
              font-semibold
            "
          >
            Filter
          </h4>
        </div>
      </button>

      {/* SORT BY */}
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
          
          hover:border-teal-300
          
          transition-all
          duration-300
        "
      >
        
        {/* ICON */}
        <div
          className="
            w-11
            h-11
            
            rounded-xl
            
            bg-gradient-to-br
            from-orange-400
            to-pink-500
            
            text-white
            
            flex
            items-center
            justify-center
            
            shadow-md
          "
        >
          <ArrowUpDown size={20} />
        </div>

        {/* CONTENT */}
        <div>
          <p
            className="
              text-xs
              
              text-slate-400
              
              font-medium
            "
          >
            Sort By
          </p>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="
                bg-transparent
                outline-none
                
                text-slate-700
                
                font-semibold
                
                appearance-none
                
                cursor-pointer
              "
            >
              <option>
                Latest
              </option>

              <option>
                Oldest
              </option>

              <option>
                Progress
              </option>

              <option>
                Destination
              </option>
            </select>

            <ChevronDown
              size={18}
              className="
                text-slate-500
              "
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripFilterBar;