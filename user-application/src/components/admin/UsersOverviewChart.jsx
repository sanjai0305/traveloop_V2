// src/components/admin/UsersOverviewChart.jsx

import React from "react";

import {
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

const UsersOverviewChart = () => {
  // MOCK DATA
  const chartData = [
    35,
    48,
    60,
    52,
    75,
    88,
    100,
  ];

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
          
          w-[260px]
          h-[260px]
          
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
              <TrendingUp
                size={16}
              />

              <span>
                Users Analytics
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
              Users Overview
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
              Monitor user registrations,
              engagement, and platform activity
              growth over the last 7 months.
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
                from-teal-500
                to-cyan-500
                
                text-white
                
                flex
                items-center
                justify-center
              "
            >
              <Users size={26} />
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
                  +28%
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
                12.4K
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Active Users
              </p>
            </div>
          </div>
        </div>

        {/* CHART */}
        <div className="mt-10">
          
          {/* BARS */}
          <div
            className="
              flex
              items-end
              justify-between
              
              gap-4
              
              h-[260px]
            "
          >
            {chartData.map(
              (value, index) => (
                <div
                  key={index}
                  className="
                    flex
                    flex-col
                    
                    items-center
                    
                    gap-4
                    
                    w-full
                  "
                >
                  
                  {/* VALUE */}
                  <span
                    className="
                      text-sm
                      
                      font-bold
                      
                      text-slate-500
                    "
                  >
                    {value}%
                  </span>

                  {/* BAR */}
                  <div
                    className="
                      relative
                      
                      w-full
                      
                      rounded-t-[24px]
                      
                      bg-gradient-to-t
                      from-teal-500
                      to-cyan-500
                      
                      shadow-lg
                      
                      hover:scale-105
                      
                      transition-all
                      duration-300
                    "
                    style={{
                      height: `${value * 2}px`,
                    }}
                  />

                  {/* LABEL */}
                  <span
                    className="
                      text-sm
                      
                      font-semibold
                      
                      text-slate-400
                    "
                  >
                    {
                      [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                      ][index]
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersOverviewChart;