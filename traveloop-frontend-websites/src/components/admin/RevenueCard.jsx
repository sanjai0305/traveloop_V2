// src/components/admin/RevenueCard.jsx

import React from "react";

import {
  IndianRupee,
  TrendingUp,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

const RevenueCard = () => {
  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        rounded-[36px]
        
        bg-gradient-to-r
        from-teal-500
        to-cyan-500
        
        p-7
        
        shadow-[0_20px_50px_rgba(6,182,212,0.35)]
      "
    >
      
      {/* GLOW */}
      <div
        className="
          absolute
          top-[-80px]
          right-[-80px]
          
          w-[220px]
          h-[220px]
          
          rounded-full
          
          bg-white/10
          
          blur-3xl
        "
      />

      {/* CONTENT */}
      <div className="relative z-10">
        
        {/* TOP */}
        <div
          className="
            flex
            items-start
            justify-between
          "
        >
          
          {/* LEFT */}
          <div>
            
            {/* LABEL */}
            <p
              className="
                text-sm
                
                uppercase
                
                tracking-[3px]
                
                text-white/70
                
                font-semibold
              "
            >
              Total Revenue
            </p>

            {/* VALUE */}
            <div
              className="
                mt-4
                
                flex
                items-end
                gap-1
              "
            >
              <IndianRupee
                size={30}
                className="
                  text-white
                  
                  mb-1
                "
              />

              <h2
                className="
                  text-5xl
                  md:text-6xl
                  
                  font-extrabold
                  
                  text-white
                  
                  leading-none
                "
              >
                4.2M
              </h2>
            </div>

            {/* DESCRIPTION */}
            <p
              className="
                mt-4
                
                text-white/80
                
                text-base
                
                leading-7
                
                max-w-md
              "
            >
              Total revenue generated from
              travel bookings, activities,
              subscriptions, and premium
              services.
            </p>
          </div>

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
            <Wallet size={38} />
          </div>
        </div>

        {/* STATS */}
        <div
          className="
            mt-10
            
            grid
            grid-cols-1
            md:grid-cols-2
            
            gap-5
          "
        >
          
          {/* MONTHLY */}
          <div
            className="
              p-5
              
              rounded-3xl
              
              bg-white/15
              backdrop-blur-xl
              
              border
              border-white/20
            "
          >
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
                  text-white
                "
              />

              <p
                className="
                  text-white/70
                  
                  text-sm
                  
                  uppercase
                  
                  tracking-[2px]
                  
                  font-semibold
                "
              >
                Monthly Growth
              </p>
            </div>

            <h3
              className="
                mt-3
                
                text-3xl
                
                font-extrabold
                
                text-white
              "
            >
              +32%
            </h3>
          </div>

          {/* BOOKINGS */}
          <div
            className="
              p-5
              
              rounded-3xl
              
              bg-white/15
              backdrop-blur-xl
              
              border
              border-white/20
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <TrendingUp
                size={18}
                className="
                  text-white
                "
              />

              <p
                className="
                  text-white/70
                  
                  text-sm
                  
                  uppercase
                  
                  tracking-[2px]
                  
                  font-semibold
                "
              >
                Bookings Growth
              </p>
            </div>

            <h3
              className="
                mt-3
                
                text-3xl
                
                font-extrabold
                
                text-white
              "
            >
              +18%
            </h3>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="
            mt-8
            
            flex
            items-center
            gap-3
            
            text-white/90
            
            font-semibold
          "
        >
          <TrendingUp size={20} />

          <span>
            Revenue is increasing steadily this quarter
          </span>
        </div>
      </div>
    </div>
  );
};

export default RevenueCard;