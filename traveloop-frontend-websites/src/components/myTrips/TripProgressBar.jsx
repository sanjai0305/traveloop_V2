// src/components/myTrips/TripProgressBar.jsx

import React from "react";

const TripProgressBar = ({
  progress = 0,
}) => {
  
  // PROGRESS COLORS
  const getProgressColor = () => {
    if (progress >= 100) {
      return "from-emerald-500 to-green-500";
    }

    if (progress >= 70) {
      return "from-teal-500 to-cyan-500";
    }

    if (progress >= 40) {
      return "from-orange-400 to-pink-500";
    }

    return "from-slate-400 to-slate-500";
  };

  return (
    <div>
      
      {/* LABEL ROW */}
      <div
        className="
          flex
          items-center
          justify-between
          
          mb-3
        "
      >
        
        {/* LABEL */}
        <span
          className="
            text-sm
            
            font-medium
            
            text-slate-500
          "
        >
          Trip Planning Progress
        </span>

        {/* PERCENTAGE */}
        <span
          className="
            text-sm
            
            font-bold
            
            text-slate-700
          "
        >
          {progress}%
        </span>
      </div>

      {/* BAR WRAPPER */}
      <div
        className="
          relative
          
          w-full
          h-4
          
          rounded-full
          
          bg-slate-200
          
          overflow-hidden
        "
      >
        
        {/* PROGRESS BAR */}
        <div
          className={`
            h-full
            
            rounded-full
            
            bg-gradient-to-r
            ${getProgressColor()}
            
            transition-all
            duration-700
          `}
          style={{
            width: `${progress}%`,
          }}
        />

        {/* GLOW */}
        <div
          className="
            absolute
            inset-0
            
            rounded-full
            
            bg-white/10
          "
        />
      </div>
    </div>
  );
};

export default TripProgressBar;