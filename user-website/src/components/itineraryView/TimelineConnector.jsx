// src/components/itineraryView/TimelineConnector.jsx

import React from "react";

const TimelineConnector = () => {
  return (
    <div
      className="
        relative
        
        flex
        justify-center
        
        py-6
      "
    >
      
      {/* LINE */}
      <div
        className="
          relative
          
          w-[4px]
          h-24
          
          rounded-full
          
          bg-gradient-to-b
          from-teal-500
          via-cyan-500
          to-sky-500
          
          shadow-[0_10px_30px_rgba(6,182,212,0.25)]
        "
      >
        
        {/* TOP DOT */}
        <div
          className="
            absolute
            top-0
            left-1/2
            
            -translate-x-1/2
            
            w-5
            h-5
            
            rounded-full
            
            bg-teal-500
            
            border-4
            border-white
            
            shadow-md
          "
        />

        {/* CENTER DOT */}
        <div
          className="
            absolute
            top-1/2
            left-1/2
            
            -translate-x-1/2
            -translate-y-1/2
            
            w-4
            h-4
            
            rounded-full
            
            bg-cyan-500
            
            border-4
            border-white
            
            shadow-md
          "
        />

        {/* BOTTOM DOT */}
        <div
          className="
            absolute
            bottom-0
            left-1/2
            
            -translate-x-1/2
            
            w-5
            h-5
            
            rounded-full
            
            bg-sky-500
            
            border-4
            border-white
            
            shadow-md
          "
        />
      </div>
    </div>
  );
};

export default TimelineConnector;