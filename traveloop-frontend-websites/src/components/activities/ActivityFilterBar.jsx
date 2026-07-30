// src/components/activities/ActivityFilterBar.jsx

import React, { useState } from "react";

import {
  SlidersHorizontal,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Mountain,
  Waves,
  Clock3,
  Star,
  MapPin,
  X,
} from "lucide-react";

const filtersData = [
  {
    id: 1,
    label: "Adventure",
    icon: Mountain,
  },
  {
    id: 2,
    label: "Beach Views",
    icon: Waves,
  },
  {
    id: 3,
    label: "Short Duration",
    icon: Clock3,
  },
  {
    id: 4,
    label: "Top Rated",
    icon: Star,
  },
  {
    id: 5,
    label: "Nearby",
    icon: MapPin,
  },
];

const ActivityFilterBar = ({
  sortBy,
  setSortBy,
}) => {
  
  // ACTIVE FILTERS
  const [activeFilters, setActiveFilters] =
    useState([
      "Adventure",
      "Top Rated",
    ]);

  // TOGGLE FILTER
  const toggleFilter = (label) => {
    if (
      activeFilters.includes(label)
    ) {
      setActiveFilters(
        activeFilters.filter(
          (item) =>
            item !== label
        )
      );
    } else {
      setActiveFilters([
        ...activeFilters,
        label,
      ]);
    }
  };

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
      <button
        className="
          h-[72px]
          
          px-5
          
          rounded-[24px]
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
          
          flex
          items-center
          gap-4
          
          hover:border-teal-300
          hover:shadow-md
          
          transition-all
          duration-300
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
            
            shadow-md
          "
        >
          <SlidersHorizontal
            size={20}
          />
        </div>

        {/* TEXT */}
        <div className="text-left">
          <p
            className="
              text-[11px]
              
              uppercase
              
              tracking-[2px]
              
              text-slate-400
              
              font-semibold
            "
          >
            Group By
          </p>

          <h4
            className="
              text-slate-700
              
              font-bold
              
              text-base
            "
          >
            Activities
          </h4>
        </div>
      </button>

      {/* FILTER */}
      <button
        className="
          h-[72px]
          
          px-5
          
          rounded-[24px]
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
          
          flex
          items-center
          gap-4
          
          hover:border-cyan-300
          hover:shadow-md
          
          transition-all
          duration-300
        "
      >
        
        {/* ICON */}
        <div
          className="
            w-12
            h-12
            
            rounded-2xl
            
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
              text-[11px]
              
              uppercase
              
              tracking-[2px]
              
              text-slate-400
              
              font-semibold
            "
          >
            Advanced
          </p>

          <h4
            className="
              text-slate-700
              
              font-bold
              
              text-base
            "
          >
            Filter
          </h4>
        </div>
      </button>

      {/* SORT */}
      <div
        className="
          h-[72px]
          
          px-5
          
          rounded-[24px]
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
          
          flex
          items-center
          gap-4
          
          hover:border-pink-300
          hover:shadow-md
          
          transition-all
          duration-300
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
            
            shadow-md
          "
        >
          <ArrowUpDown
            size={20}
          />
        </div>

        {/* CONTENT */}
        <div>
          <p
            className="
              text-[11px]
              
              uppercase
              
              tracking-[2px]
              
              text-slate-400
              
              font-semibold
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
                setSortBy(
                  e.target.value
                )
              }
              className="
                bg-transparent
                outline-none
                
                text-slate-700
                
                font-bold
                
                appearance-none
                
                cursor-pointer
              "
            >
              <option>
                Popular
              </option>

              <option>
                Highest Rated
              </option>

              <option>
                Lowest Price
              </option>

              <option>
                Short Duration
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

      {/* FILTER TAGS */}
      <div
        className="
          flex
          flex-wrap
          
          items-center
          
          gap-3
          
          w-full
          
          mt-1
        "
      >
        {filtersData.map(
          (filter) => {
            const Icon =
              filter.icon;

            const isActive =
              activeFilters.includes(
                filter.label
              );

            return (
              <button
                key={filter.id}
                onClick={() =>
                  toggleFilter(
                    filter.label
                  )
                }
                className={`
                  flex
                  items-center
                  gap-2
                  
                  px-5
                  h-12
                  
                  rounded-full
                  
                  border
                  
                  text-sm
                  
                  font-semibold
                  
                  transition-all
                  duration-300
                  
                  ${
                    isActive
                      ? `
                        bg-gradient-to-r
                        from-teal-500
                        to-cyan-500
                        
                        text-white
                        
                        border-transparent
                        
                        shadow-lg
                      `
                      : `
                        bg-white
                        
                        text-slate-700
                        
                        border-slate-200
                        
                        hover:border-teal-400
                        hover:text-teal-600
                      `
                  }
                `}
              >
                
                {/* ICON */}
                <Icon
                  className="
                    w-4
                    h-4
                  "
                />

                {/* LABEL */}
                <span>
                  {filter.label}
                </span>

                {/* CLOSE */}
                {isActive && (
                  <X
                    className="
                      w-4
                      h-4
                    "
                  />
                )}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
};

export default ActivityFilterBar;