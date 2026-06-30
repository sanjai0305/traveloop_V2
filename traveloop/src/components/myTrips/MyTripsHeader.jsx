// src/components/myTrips/MyTripsHeader.jsx

import React from "react";

import {
  Luggage,
  Sparkles,
  Plane,
} from "lucide-react";

const MyTripsHeader = () => {
  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        rounded-[36px]
        
        bg-gradient-to-r
        from-teal-500
        via-cyan-500
        to-sky-500
        
        px-6
        md:px-10
        
        py-10
        md:py-14
        
        shadow-[0_20px_60px_rgba(6,182,212,0.35)]
      "
    >
      
      {/* BACKGROUND GLOW */}
      <div
        className="
          absolute
          top-[-120px]
          right-[-120px]
          
          w-[320px]
          h-[320px]
          
          rounded-full
          
          bg-white/10
          
          blur-3xl
        "
      />

      {/* BACKGROUND ICON */}
      <div
        className="
          absolute
          right-10
          bottom-[-10px]
          
          hidden
          lg:block
        "
      >
        <Plane
          size={220}
          className="
            text-white/10
            
            rotate-[20deg]
          "
        />
      </div>

      {/* CONTENT */}
      <div className="relative z-10">
        
        {/* BADGE */}
        <div
          className="
            flex
            items-center
            gap-2
            
            w-fit
            
            px-4
            py-2
            
            rounded-full
            
            bg-white/15
            backdrop-blur-xl
            
            border
            border-white/20
            
            text-white
            
            text-sm
            
            font-semibold
          "
        >
          <Sparkles size={16} />

          <span>
            Smart Trip Management
          </span>
        </div>

        {/* TITLE */}
        <div
          className="
            flex
            items-center
            gap-5
            
            mt-6
          "
        >
          
          {/* ICON */}
          <div
            className="
              w-20
              h-20
              
              rounded-3xl
              
              bg-white/15
              backdrop-blur-xl
              
              border
              border-white/20
              
              flex
              items-center
              justify-center
              
              text-white
            "
          >
            <Luggage size={38} />
          </div>

          {/* TEXT */}
          <div>
            <h1
              className="
                text-4xl
                md:text-6xl
                
                font-extrabold
                
                text-white
                
                leading-tight
              "
            >
              My Trips
            </h1>

            <p
              className="
                mt-3
                
                max-w-2xl
                
                text-white/80
                
                text-base
                md:text-lg
                
                leading-8
              "
            >
              Manage your ongoing, upcoming,
              and completed adventures all
              in one beautiful dashboard.
            </p>
          </div>
        </div>

        {/* STATS */}
        <div
          className="
            flex
            flex-wrap
            
            items-center
            
            gap-5
            
            mt-10
          "
        >
          
          {/* CARD 1 */}
          <div
            className="
              px-6
              py-5
              
              rounded-3xl
              
              bg-white/15
              backdrop-blur-xl
              
              border
              border-white/20
            "
          >
            <h3
              className="
                text-3xl
                
                font-extrabold
                
                text-white
              "
            >
              12
            </h3>

            <p
              className="
                mt-2
                
                text-sm
                
                text-white/70
              "
            >
              Total Trips
            </p>
          </div>

          {/* CARD 2 */}
          <div
            className="
              px-6
              py-5
              
              rounded-3xl
              
              bg-white/15
              backdrop-blur-xl
              
              border
              border-white/20
            "
          >
            <h3
              className="
                text-3xl
                
                font-extrabold
                
                text-white
              "
            >
              4
            </h3>

            <p
              className="
                mt-2
                
                text-sm
                
                text-white/70
              "
            >
              Ongoing Trips
            </p>
          </div>

          {/* CARD 3 */}
          <div
            className="
              px-6
              py-5
              
              rounded-3xl
              
              bg-white/15
              backdrop-blur-xl
              
              border
              border-white/20
            "
          >
            <h3
              className="
                text-3xl
                
                font-extrabold
                
                text-white
              "
            >
              18
            </h3>

            <p
              className="
                mt-2
                
                text-sm
                
                text-white/70
              "
            >
              Countries Visited
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTripsHeader;