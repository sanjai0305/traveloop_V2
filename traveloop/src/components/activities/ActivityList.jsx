// src/components/activities/ActivityList.jsx

import React from "react";

// COMPONENTS
import ActivityCard from "./ActivityCard";
import EmptyActivityState from "./EmptyActivityState";

const ActivityList = ({
  activities = [],
}) => {
  return (
    <div className="w-full">
      
      {/* EMPTY STATE */}
      {activities.length === 0 ? (
        <EmptyActivityState />
      ) : (
        
        <>
          
          {/* GRID */}
          <div
            className="
              flex
              flex-col
              
              gap-8
            "
          >
            {activities.map(
              (activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                />
              )
            )}
          </div>

          {/* PAGINATION */}
          <div
            className="
              mt-12
              
              flex
              items-center
              justify-center
              
              gap-3
              
              flex-wrap
            "
          >
            
            {/* PAGE BUTTON */}
            <button
              className="
                w-12
                h-12
                
                rounded-2xl
                
                bg-gradient-to-r
                from-teal-500
                to-cyan-500
                
                text-white
                
                font-bold
                
                shadow-lg
              "
            >
              1
            </button>

            {/* PAGE BUTTON */}
            <button
              className="
                w-12
                h-12
                
                rounded-2xl
                
                bg-white
                
                border
                border-slate-200
                
                text-slate-700
                
                font-semibold
                
                hover:border-teal-300
                hover:text-teal-600
                
                transition-all
                duration-300
              "
            >
              2
            </button>

            {/* PAGE BUTTON */}
            <button
              className="
                w-12
                h-12
                
                rounded-2xl
                
                bg-white
                
                border
                border-slate-200
                
                text-slate-700
                
                font-semibold
                
                hover:border-teal-300
                hover:text-teal-600
                
                transition-all
                duration-300
              "
            >
              3
            </button>

            {/* PAGE BUTTON */}
            <button
              className="
                w-12
                h-12
                
                rounded-2xl
                
                bg-white
                
                border
                border-slate-200
                
                text-slate-700
                
                font-semibold
                
                hover:border-teal-300
                hover:text-teal-600
                
                transition-all
                duration-300
              "
            >
              4
            </button>

            {/* DOTS */}
            <div
              className="
                px-2
                
                text-slate-400
                
                font-bold
              "
            >
              ...
            </div>

            {/* PAGE BUTTON */}
            <button
              className="
                w-12
                h-12
                
                rounded-2xl
                
                bg-white
                
                border
                border-slate-200
                
                text-slate-700
                
                font-semibold
                
                hover:border-teal-300
                hover:text-teal-600
                
                transition-all
                duration-300
              "
            >
              10
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityList;