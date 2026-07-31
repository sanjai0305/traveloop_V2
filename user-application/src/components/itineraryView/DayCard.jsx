// src/components/itineraryView/DayCard.jsx

import React from "react";

import {
  CalendarDays,
  Sparkles,
} from "lucide-react";

// COMPONENTS
import ActivityTimelineCard from "./ActivityTimelineCard";

const DayCard = ({ item }) => {
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
        
        p-6
        md:p-8
        
        hover:shadow-xl
        
        transition-all
        duration-500
      "
    >
      
      {/* GLOW */}
      <div
        className="
          absolute
          top-[-100px]
          right-[-100px]
          
          w-72
          h-72
          
          rounded-full
          
          bg-cyan-200/20
          
          blur-3xl
        "
      />

      {/* CONTENT */}
      <div className="relative z-10">
        
        {/* TOP */}
        <div
          className="
            flex
            flex-col
            xl:flex-row
            
            items-start
            xl:items-center
            
            justify-between
            
            gap-6
          "
        >
          
          {/* LEFT */}
          <div
            className="
              flex
              items-start
              gap-5
            "
          >
            
            {/* DAY BADGE */}
            <div
              className="
                min-w-[90px]
                min-h-[90px]
                
                rounded-[28px]
                
                bg-gradient-to-br
                from-teal-500
                to-cyan-500
                
                text-white
                
                flex
                flex-col
                items-center
                justify-center
                
                shadow-[0_15px_35px_rgba(6,182,212,0.35)]
              "
            >
              <span
                className="
                  text-sm
                  
                  uppercase
                  
                  tracking-[2px]
                  
                  font-semibold
                  
                  opacity-80
                "
              >
                Day
              </span>

              <h2
                className="
                  text-3xl
                  
                  font-extrabold
                "
              >
                {item.day.replace(
                  "Day ",
                  ""
                )}
              </h2>
            </div>

            {/* TEXT */}
            <div>
              
              {/* DATE */}
              <div
                className="
                  flex
                  items-center
                  gap-2
                  
                  text-slate-500
                  
                  font-medium
                "
              >
                <CalendarDays
                  size={18}
                />

                <span>
                  {item.date}
                </span>
              </div>

              {/* TITLE */}
              <h2
                className="
                  mt-4
                  
                  text-3xl
                  md:text-4xl
                  
                  font-extrabold
                  
                  text-slate-900
                  
                  leading-tight
                "
              >
                {item.title}
              </h2>

              {/* DESCRIPTION */}
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
                {item.description}
              </p>
            </div>
          </div>

          {/* BADGE */}
          <div
            className="
              flex
              items-center
              gap-2
              
              px-5
              py-3
              
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
              AI Optimized Schedule
            </span>
          </div>
        </div>

        {/* ACTIVITIES */}
        <div
          className="
            mt-10
            
            flex
            flex-col
            
            gap-6
          "
        >
          {item.activities.map(
            (activity) => (
              <ActivityTimelineCard
                key={activity.id}
                activity={activity}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DayCard;