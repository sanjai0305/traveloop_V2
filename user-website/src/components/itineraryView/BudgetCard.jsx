// src/components/itineraryView/BudgetCard.jsx

import React from "react";

import {
  Wallet,
  IndianRupee,
  TrendingUp,
  ChevronDown,
} from "lucide-react";

const BudgetCard = ({
  total = "1,25,000",
  spent = "84,500",
  remaining = "40,500",
}) => {
  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        rounded-[34px]
        
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
          
          w-52
          h-52
          
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
              Total Budget
            </p>

            {/* PRICE */}
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
                {total}
              </h2>
            </div>

            {/* SUBTEXT */}
            <p
              className="
                mt-4
                
                text-white/80
                
                text-base
                
                leading-7
                
                max-w-md
              "
            >
              Track and manage your travel
              expenses efficiently across
              hotels, transport, food, and
              activities.
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
            md:grid-cols-3
            
            gap-5
          "
        >
          
          {/* SPENT */}
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
            <p
              className="
                text-white/70
                
                text-sm
                
                uppercase
                
                tracking-[2px]
                
                font-semibold
              "
            >
              Spent
            </p>

            <h3
              className="
                mt-3
                
                text-3xl
                
                font-extrabold
                
                text-white
              "
            >
              ₹{spent}
            </h3>
          </div>

          {/* REMAINING */}
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
            <p
              className="
                text-white/70
                
                text-sm
                
                uppercase
                
                tracking-[2px]
                
                font-semibold
              "
            >
              Remaining
            </p>

            <h3
              className="
                mt-3
                
                text-3xl
                
                font-extrabold
                
                text-white
              "
            >
              ₹{remaining}
            </h3>
          </div>

          {/* STATUS */}
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
                Budget Status
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
              Healthy
            </h3>
          </div>
        </div>

        {/* DROPDOWN */}
        <button
          className="
            mt-8
            
            flex
            items-center
            gap-3
            
            px-5
            py-4
            
            rounded-2xl
            
            bg-white/15
            backdrop-blur-xl
            
            border
            border-white/20
            
            text-white
            
            font-semibold
            
            hover:bg-white/20
            
            transition-all
            duration-300
          "
        >
          <span>
            View Expense Breakdown
          </span>

          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  );
};

export default BudgetCard;