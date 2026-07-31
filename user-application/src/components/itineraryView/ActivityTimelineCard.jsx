// src/components/itineraryView/ActivityTimelineCard.jsx

import React from "react";

import {
  Clock3,
  ArrowRight,
} from "lucide-react";

// COMPONENTS
import ActivityIcon from "./ActivityIcon";
import ExpenseCard from "./ExpenseCard";

const ActivityTimelineCard = ({
  activity,
}) => {
  return (
    <div
      className="
        group
        
        bg-slate-50
        
        border
        border-slate-200
        
        rounded-[30px]
        
        overflow-hidden
        
        hover:bg-white
        hover:shadow-lg
        
        transition-all
        duration-500
      "
    >
      
      <div
        className="
          flex
          flex-col
          lg:flex-row
        "
      >
        
        {/* IMAGE */}
        <div
          className="
            relative
            
            lg:w-[280px]
            w-full
            
            h-[220px]
            
            overflow-hidden
            
            flex-shrink-0
          "
        >
          <img
            src={activity.image}
            alt={activity.title}
            className="
              w-full
              h-full
              
              object-cover
              
              transition-transform
              duration-700
              
              group-hover:scale-105
            "
          />

          {/* OVERLAY */}
          <div
            className="
              absolute
              inset-0
              
              bg-gradient-to-t
              from-black/60
              via-black/10
              to-transparent
            "
          />

          {/* TYPE BADGE */}
          <div
            className="
              absolute
              bottom-5
              left-5
            "
          >
            <ActivityIcon
              type={activity.type}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="
            flex-1
            
            p-6
            md:p-8
            
            flex
            flex-col
            justify-between
          "
        >
          
          {/* TOP */}
          <div>
            
            {/* TIME */}
            <div
              className="
                flex
                items-center
                gap-2
                
                text-slate-500
                
                font-medium
              "
            >
              <Clock3
                size={18}
              />

              <span>
                {activity.time}
              </span>
            </div>

            {/* TITLE */}
            <h2
              className="
                mt-4
                
                text-2xl
                md:text-3xl
                
                font-extrabold
                
                text-slate-900
                
                leading-tight
              "
            >
              {activity.title}
            </h2>

            {/* DESCRIPTION */}
            <p
              className="
                mt-4
                
                text-slate-500
                
                text-base
                
                leading-8
                
                max-w-3xl
              "
            >
              Enjoy a well-planned and premium
              travel experience with seamless
              arrangements and unforgettable
              memories throughout your journey.
            </p>
          </div>

          {/* BOTTOM */}
          <div
            className="
              mt-8
              
              flex
              flex-col
              lg:flex-row
              
              items-start
              lg:items-center
              
              justify-between
              
              gap-5
            "
          >
            
            {/* EXPENSE */}
            <ExpenseCard
              price={activity.price}
            />

            {/* BUTTON */}
            <button
              className="
                group/button
                
                flex
                items-center
                gap-3
                
                px-6
                py-4
                
                rounded-2xl
                
                bg-gradient-to-r
                from-teal-500
                to-cyan-500
                
                text-white
                
                font-semibold
                
                shadow-[0_15px_35px_rgba(6,182,212,0.35)]
                
                hover:scale-[1.03]
                
                transition-all
                duration-300
              "
            >
              <span>
                View Details
              </span>

              <ArrowRight
                size={18}
                className="
                  transition-transform
                  duration-300
                  
                  group-hover/button:translate-x-1
                "
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTimelineCard;