// src/components/admin/UserGrowthChart.jsx

import React from "react";

import {
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";

const growthData = [
  {
    month: "Jan",
    users: 2400,
  },

  {
    month: "Feb",
    users: 3200,
  },

  {
    month: "Mar",
    users: 4100,
  },

  {
    month: "Apr",
    users: 5200,
  },

  {
    month: "May",
    users: 6800,
  },

  {
    month: "Jun",
    users: 8200,
  },

  {
    month: "Jul",
    users: 12400,
  },
];

const UserGrowthChart = () => {
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
          
          w-[260px]
          h-[260px]
          
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
            flex-col
            lg:flex-row
            
            items-start
            lg:items-center
            
            justify-between
            
            gap-6
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
              <Activity
                size={16}
              />

              <span>
                Growth Analytics
              </span>
            </div>

            {/* TITLE */}
            <h2
              className="
                mt-5
                
                text-3xl
                md:text-4xl
                
                font-extrabold
                
                text-slate-900
              "
            >
              User Growth
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
              Analyze monthly growth trends,
              user registrations, and platform
              expansion across all regions.
            </p>
          </div>

          {/* RIGHT */}
          <div
            className="
              flex
              items-center
              gap-4
              
              px-6
              py-5
              
              rounded-3xl
              
              bg-white
              
              border
              border-slate-200
              
              shadow-sm
            "
          >
            
            {/* ICON */}
            <div
              className="
                w-14
                h-14
                
                rounded-2xl
                
                bg-gradient-to-br
                from-orange-400
                to-pink-500
                
                text-white
                
                flex
                items-center
                justify-center
              "
            >
              <TrendingUp size={26} />
            </div>

            {/* TEXT */}
            <div>
              
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <ArrowUpRight
                  size={18}
                  className="
                    text-emerald-500
                  "
                />

                <span
                  className="
                    text-emerald-500
                    
                    font-bold
                  "
                >
                  +42%
                </span>
              </div>

              <h3
                className="
                  mt-2
                  
                  text-3xl
                  
                  font-extrabold
                  
                  text-slate-900
                "
              >
                124K
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Monthly Reach
              </p>
            </div>
          </div>
        </div>

        {/* CHART */}
        <div className="mt-10">
          
          {/* GRAPH AREA */}
          <div
            className="
              relative
              
              h-[320px]
              
              rounded-[32px]
              
              bg-slate-50
              
              border
              border-slate-200
              
              overflow-hidden
              
              p-6
            "
          >
            
            {/* GRID */}
            <div
              className="
                absolute
                inset-0
                
                flex
                flex-col
                justify-between
                
                px-6
                py-6
              "
            >
              {[...Array(5)].map(
                (_, index) => (
                  <div
                    key={index}
                    className="
                      w-full
                      
                      border-t
                      border-dashed
                      border-slate-200
                    "
                  />
                )
              )}
            </div>

            {/* LINE */}
            <svg
              viewBox="0 0 700 300"
              className="
                relative
                z-10
                
                w-full
                h-full
              "
            >
              
              {/* PATH */}
              <path
                d="
                  M 40 240
                  C 100 220, 130 190, 180 180
                  S 280 120, 340 110
                  S 430 80, 500 70
                  S 610 30, 660 20
                "
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
              />

              {/* GRADIENT */}
              <defs>
                <linearGradient
                  id="gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    stopColor="#14b8a6"
                  />

                  <stop
                    offset="100%"
                    stopColor="#06b6d4"
                  />
                </linearGradient>
              </defs>

              {/* DOTS */}
              {growthData.map(
                (item, index) => (
                  <circle
                    key={index}
                    cx={
                      40 +
                      index * 100
                    }
                    cy={
                      240 -
                      index * 35
                    }
                    r="10"
                    fill="#06b6d4"
                    stroke="white"
                    strokeWidth="5"
                  />
                )
              )}
            </svg>

            {/* LABELS */}
            <div
              className="
                absolute
                bottom-6
                left-6
                right-6
                
                flex
                justify-between
                
                z-20
              "
            >
              {growthData.map(
                (item, index) => (
                  <div
                    key={index}
                    className="
                      flex
                      flex-col
                      items-center
                    "
                  >
                    <span
                      className="
                        text-sm
                        
                        font-bold
                        
                        text-slate-700
                      "
                    >
                      {item.users}
                    </span>

                    <span
                      className="
                        mt-2
                        
                        text-sm
                        
                        font-semibold
                        
                        text-slate-400
                      "
                    >
                      {item.month}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGrowthChart;