// src/components/myTrips/EmptyTripsState.jsx

import React from "react";

import {
  Plane,
  Plus,
  Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const EmptyTripsState = () => {
  
  const navigate = useNavigate();

  // HANDLE CREATE
  const handleCreateTrip = () => {
    navigate("/create-trip");
  };

  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        rounded-[36px]
        
        bg-white
        
        border
        border-slate-200
        
        shadow-sm
        
        px-6
        md:px-10
        
        py-16
      "
    >
      
      {/* TOP GLOW */}
      <div
        className="
          absolute
          top-[-120px]
          right-[-120px]
          
          w-[320px]
          h-[320px]
          
          rounded-full
          
          bg-cyan-200/20
          
          blur-3xl
        "
      />

      {/* BOTTOM GLOW */}
      <div
        className="
          absolute
          bottom-[-120px]
          left-[-120px]
          
          w-[320px]
          h-[320px]
          
          rounded-full
          
          bg-teal-200/20
          
          blur-3xl
        "
      />

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          
          flex
          flex-col
          items-center
          justify-center
          
          text-center
        "
      >
        
        {/* ICON */}
        <div
          className="
            flex
            items-center
            justify-center
            
            w-28
            h-28
            
            rounded-[32px]
            
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            
            text-white
            
            shadow-[0_20px_50px_rgba(6,182,212,0.35)]
          "
        >
          <Plane
            size={52}
            className="
              rotate-[20deg]
            "
          />
        </div>

        {/* BADGE */}
        <div
          className="
            mt-8
            
            flex
            items-center
            gap-2
            
            px-4
            py-2
            
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
            Smart AI Travel Planner
          </span>
        </div>

        {/* TITLE */}
        <h2
          className="
            mt-6
            
            text-3xl
            md:text-5xl
            
            font-extrabold
            
            text-slate-800
            
            leading-tight
          "
        >
          No Trips Found
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-5
            
            max-w-2xl
            
            text-slate-500
            
            text-base
            md:text-lg
            
            leading-8
          "
        >
          You haven’t created any trips yet.
          Start planning your dream destinations,
          adventures, itineraries, and unforgettable
          travel experiences today.
        </p>

        {/* STATS */}
        <div
          className="
            flex
            flex-wrap
            
            items-center
            justify-center
            
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
              
              bg-white
              
              border
              border-slate-200
              
              shadow-sm
            "
          >
            <h3
              className="
                text-3xl
                
                font-extrabold
                
                text-teal-600
              "
            >
              120+
            </h3>

            <p
              className="
                mt-2
                
                text-sm
                
                text-slate-500
              "
            >
              Global Destinations
            </p>
          </div>

          {/* CARD 2 */}
          <div
            className="
              px-6
              py-5
              
              rounded-3xl
              
              bg-white
              
              border
              border-slate-200
              
              shadow-sm
            "
          >
            <h3
              className="
                text-3xl
                
                font-extrabold
                
                text-cyan-600
              "
            >
              AI
            </h3>

            <p
              className="
                mt-2
                
                text-sm
                
                text-slate-500
              "
            >
              Smart Recommendations
            </p>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleCreateTrip}
          className="
            group
            
            mt-10
            
            flex
            items-center
            gap-3
            
            px-8
            py-5
            
            rounded-2xl
            
            bg-gradient-to-r
            from-teal-500
            to-cyan-500
            
            text-white
            
            font-semibold
            text-lg
            
            shadow-[0_15px_35px_rgba(6,182,212,0.35)]
            
            hover:scale-[1.03]
            hover:shadow-[0_20px_45px_rgba(6,182,212,0.45)]
            
            transition-all
            duration-300
          "
        >
          
          {/* ICON */}
          <Plus
            size={24}
            className="
              transition-transform
              duration-300
              
              group-hover:rotate-90
            "
          />

          <span>
            Create Your First Trip
          </span>
        </button>
      </div>
    </div>
  );
};

export default EmptyTripsState;