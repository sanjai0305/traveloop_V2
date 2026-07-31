// src/components/admin/TopCitiesChart.jsx

import React from "react";

import {
  MapPinned,
  TrendingUp,
} from "lucide-react";

const cities = [
  {
    id: 1,
    city: "Paris",
    bookings: "18K",
    progress: 92,
  },

  {
    id: 2,
    city: "Dubai",
    bookings: "15K",
    progress: 84,
  },

  {
    id: 3,
    city: "Bali",
    bookings: "12K",
    progress: 76,
  },

  {
    id: 4,
    city: "Switzerland",
    bookings: "10K",
    progress: 68,
  },
];

const TopCitiesChart = () => {
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
        
        p-7
      "
    >
      
      {/* GLOW */}
      <div
        className="
          absolute
          top-[-120px]
          right-[-120px]
          
          w-[240px]
          h-[240px]
          
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
            items-center
            justify-between
            
            gap-4
          "
        >
          
          {/* LEFT */}
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
              <TrendingUp
                size={16}
              />

              <span>
                Top Destinations
              </span>
            </div>

            {/* TITLE */}
            <h2
              className="
                mt-5
                
                text-3xl
                
                font-extrabold
                
                text-slate-900
              "
            >
              Popular Cities
            </h2>
          </div>

          {/* ICON */}
          <div
            className="
              w-16
              h-16
              
              rounded-3xl
              
              bg-gradient-to-br
              from-teal-500
              to-cyan-500
              
              text-white
              
              flex
              items-center
              justify-center
              
              shadow-lg
            "
          >
            <MapPinned size={30} />
          </div>
        </div>

        {/* LIST */}
        <div
          className="
            mt-8
            
            flex
            flex-col
            
            gap-6
          "
        >
          {cities.map((item) => (
            <div
              key={item.id}
            >
              
              {/* TOP */}
              <div
                className="
                  flex
                  items-center
                  justify-between
                  
                  mb-3
                "
              >
                
                {/* CITY */}
                <div>
                  <h3
                    className="
                      text-lg
                      
                      font-bold
                      
                      text-slate-900
                    "
                  >
                    {item.city}
                  </h3>

                  <p
                    className="
                      text-sm
                      
                      text-slate-500
                    "
                  >
                    {item.bookings} bookings
                  </p>
                </div>

                {/* PERCENT */}
                <span
                  className="
                    text-sm
                    
                    font-bold
                    
                    text-slate-700
                  "
                >
                  {item.progress}%
                </span>
              </div>

              {/* BAR */}
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
                
                {/* FILL */}
                <div
                  className="
                    h-full
                    
                    rounded-full
                    
                    bg-gradient-to-r
                    from-teal-500
                    to-cyan-500
                    
                    transition-all
                    duration-700
                  "
                  style={{
                    width: `${item.progress}%`,
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopCitiesChart;