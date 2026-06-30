// src/components/admin/TopActivitiesChart.jsx

import React from "react";

import {
  Star,
  TrendingUp,
  Plane,
  Mountain,
  Camera,
  Waves,
} from "lucide-react";

const activities = [
  {
    id: 1,
    name: "Paragliding",
    bookings: "24K",
    progress: 95,
    icon: Plane,
    gradient:
      "from-teal-500 to-cyan-500",
  },

  {
    id: 2,
    name: "Mountain Hiking",
    bookings: "18K",
    progress: 82,
    icon: Mountain,
    gradient:
      "from-emerald-500 to-green-500",
  },

  {
    id: 3,
    name: "Photography Tours",
    bookings: "14K",
    progress: 70,
    icon: Camera,
    gradient:
      "from-orange-400 to-pink-500",
  },

  {
    id: 4,
    name: "Beach Activities",
    bookings: "11K",
    progress: 60,
    icon: Waves,
    gradient:
      "from-cyan-500 to-sky-500",
  },
];

const TopActivitiesChart = () => {
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
          bottom-[-120px]
          left-[-120px]
          
          w-[240px]
          h-[240px]
          
          rounded-full
          
          bg-teal-200/20
          
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
                Activity Analytics
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
              Top Activities
            </h2>
          </div>

          {/* ICON */}
          <div
            className="
              w-16
              h-16
              
              rounded-3xl
              
              bg-gradient-to-br
              from-orange-400
              to-pink-500
              
              text-white
              
              flex
              items-center
              justify-center
              
              shadow-lg
            "
          >
            <Star size={30} />
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
          {activities.map(
            (activity) => {
              const Icon =
                activity.icon;

              return (
                <div
                  key={activity.id}
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
                    
                    {/* LEFT */}
                    <div
                      className="
                        flex
                        items-center
                        gap-4
                      "
                    >
                      
                      {/* ICON */}
                      <div
                        className={`
                          w-12
                          h-12
                          
                          rounded-2xl
                          
                          bg-gradient-to-br
                          ${activity.gradient}
                          
                          text-white
                          
                          flex
                          items-center
                          justify-center
                        `}
                      >
                        <Icon
                          size={22}
                        />
                      </div>

                      {/* TEXT */}
                      <div>
                        <h3
                          className="
                            text-lg
                            
                            font-bold
                            
                            text-slate-900
                          "
                        >
                          {activity.name}
                        </h3>

                        <p
                          className="
                            text-sm
                            
                            text-slate-500
                          "
                        >
                          {activity.bookings} bookings
                        </p>
                      </div>
                    </div>

                    {/* PERCENT */}
                    <span
                      className="
                        text-sm
                        
                        font-bold
                        
                        text-slate-700
                      "
                    >
                      {activity.progress}%
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
                      className={`
                        h-full
                        
                        rounded-full
                        
                        bg-gradient-to-r
                        ${activity.gradient}
                        
                        transition-all
                        duration-700
                      `}
                      style={{
                        width: `${activity.progress}%`,
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
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default TopActivitiesChart;