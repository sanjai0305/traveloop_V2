// src/components/trip/CreateTripHeader.jsx

import React from "react";

import {
  ArrowLeft,
  MapPinned,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

// IMAGE
import TripBanner from "../../assets/images/trip-banner.jpg";

const CreateTripHeader = () => {
  
  const navigate = useNavigate();

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
      "
    >
      
      {/* BACKGROUND BANNER */}
      <div
        className="
          absolute
          top-0
          right-0
          
          w-[45%]
          h-full
          
          hidden
          lg:block
          
          overflow-hidden
        "
      >
        <img
          src={TripBanner}
          alt="Trip Banner"
          className="
            w-full
            h-full
            
            object-cover
            
            opacity-90
          "
        />

        {/* OVERLAY */}
        <div
          className="
            absolute
            inset-0
            
            bg-gradient-to-l
            from-transparent
            via-white/40
            to-white
          "
        />
      </div>

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          
          flex
          flex-col
          lg:flex-row
          
          items-start
          lg:items-center
          
          justify-between
          
          gap-8
          
          px-6
          md:px-10
          
          py-10
        "
      >
        
        {/* LEFT SIDE */}
        <div
          className="
            flex
            items-start
            gap-5
          "
        >
          
          {/* BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="
              group
              
              w-16
              h-16
              
              rounded-2xl
              
              bg-slate-100
              
              border
              border-slate-200
              
              flex
              items-center
              justify-center
              
              shadow-sm
              
              hover:bg-white
              hover:border-teal-300
              hover:shadow-md
              
              transition-all
              duration-300
            "
          >
            <ArrowLeft
              size={28}
              className="
                text-slate-700
                
                transition-transform
                duration-300
                
                group-hover:-translate-x-1
              "
            />
          </button>

          {/* TEXT CONTENT */}
          <div>
            
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
                
                bg-teal-50
                
                border
                border-teal-100
                
                text-teal-700
                
                text-sm
                
                font-semibold
              "
            >
              <MapPinned size={16} />

              <span>
                Travel Planner
              </span>
            </div>

            {/* TITLE */}
            <h1
              className="
                mt-5
                
                text-4xl
                md:text-5xl
                
                font-extrabold
                
                text-slate-800
                
                leading-tight
              "
            >
              Create A New Trip
            </h1>

            {/* SUBTITLE */}
            <p
              className="
                mt-4
                
                max-w-2xl
                
                text-base
                md:text-lg
                
                text-slate-500
                
                leading-8
              "
            >
              Start planning your next unforgettable
              adventure by selecting destinations,
              travel dates, and exciting experiences.
            </p>
          </div>
        </div>

        {/* RIGHT STATS */}
        <div
          className="
            hidden
            xl:flex
            
            items-center
            gap-5
          "
        >
          
          {/* CARD 1 */}
          <div
            className="
              px-6
              py-5
              
              rounded-3xl
              
              bg-white/90
              backdrop-blur-xl
              
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
              Destinations
            </p>
          </div>

          {/* CARD 2 */}
          <div
            className="
              px-6
              py-5
              
              rounded-3xl
              
              bg-white/90
              backdrop-blur-xl
              
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
              5K+
            </h3>

            <p
              className="
                mt-2
                
                text-sm
                
                text-slate-500
              "
            >
              Happy Travelers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTripHeader;