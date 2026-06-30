// src/components/activities/ActivityMeta.jsx

import React from "react";

import {
  MapPin,
  Clock3,
  Users,
} from "lucide-react";

const ActivityMeta = ({
  location,
  duration,
  groupSize = "1 - 10 People",
}) => {
  return (
    <div
      className="
        flex
        flex-wrap
        
        items-center
        
        gap-5
        md:gap-7
        
        mt-6
      "
    >
      
      {/* LOCATION */}
      <div
        className="
          flex
          items-center
          gap-3
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
          <MapPin
            className="
              w-5
              h-5
            "
          />
        </div>

        {/* TEXT */}
        <div className="flex flex-col">
          
          <span
            className="
              text-xs
              
              font-semibold
              
              text-slate-400
              
              uppercase
              
              tracking-[2px]
            "
          >
            Location
          </span>

          <span
            className="
              text-slate-700
              
              font-bold
              
              text-sm
              md:text-base
            "
          >
            {location}
          </span>
        </div>
      </div>

      {/* DURATION */}
      <div
        className="
          flex
          items-center
          gap-3
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
          <Clock3
            className="
              w-5
              h-5
            "
          />
        </div>

        {/* TEXT */}
        <div className="flex flex-col">
          
          <span
            className="
              text-xs
              
              font-semibold
              
              text-slate-400
              
              uppercase
              
              tracking-[2px]
            "
          >
            Duration
          </span>

          <span
            className="
              text-slate-700
              
              font-bold
              
              text-sm
              md:text-base
            "
          >
            {duration}
          </span>
        </div>
      </div>

      {/* GROUP SIZE */}
      <div
        className="
          flex
          items-center
          gap-3
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
          <Users
            className="
              w-5
              h-5
            "
          />
        </div>

        {/* TEXT */}
        <div className="flex flex-col">
          
          <span
            className="
              text-xs
              
              font-semibold
              
              text-slate-400
              
              uppercase
              
              tracking-[2px]
            "
          >
            Group Size
          </span>

          <span
            className="
              text-slate-700
              
              font-bold
              
              text-sm
              md:text-base
            "
          >
            {groupSize}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityMeta;