// src/components/admin/AnalyticsCard.jsx

import React from "react";

import {
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

const AnalyticsCard = ({
  title = "Analytics",
  value = "0",
  growth = "+0%",
  description = "Analytics description",
  icon: Icon,
  gradient = "from-teal-500 to-cyan-500",
}) => {
  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        bg-white
        
        border
        border-slate-200
        
        rounded-[32px]
        
        shadow-sm
        
        p-6
        
        hover:shadow-xl
        hover:-translate-y-1
        
        transition-all
        duration-500
      "
    >
      
      {/* GLOW */}
      <div
        className={`
          absolute
          top-[-100px]
          right-[-100px]
          
          w-[220px]
          h-[220px]
          
          rounded-full
          
          bg-gradient-to-br
          ${gradient}
          
          opacity-10
          
          blur-3xl
        `}
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
          
          {/* ICON */}
          <div
            className={`
              w-16
              h-16
              
              rounded-[24px]
              
              bg-gradient-to-br
              ${gradient}
              
              text-white
              
              flex
              items-center
              justify-center
              
              shadow-lg
            `}
          >
            {Icon && (
              <Icon size={30} />
            )}
          </div>

          {/* GROWTH */}
          <div
            className="
              flex
              items-center
              gap-2
              
              px-4
              py-2
              
              rounded-full
              
              bg-emerald-50
              
              border
              border-emerald-100
              
              text-emerald-600
              
              text-sm
              
              font-bold
            "
          >
            <ArrowUpRight
              size={16}
            />

            <span>
              {growth}
            </span>
          </div>
        </div>

        {/* TITLE */}
        <p
          className="
            mt-6
            
            text-sm
            
            uppercase
            
            tracking-[2px]
            
            text-slate-400
            
            font-semibold
          "
        >
          {title}
        </p>

        {/* VALUE */}
        <h2
          className="
            mt-3
            
            text-4xl
            
            font-extrabold
            
            text-slate-900
          "
        >
          {value}
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-4
            
            text-slate-500
            
            text-base
            
            leading-7
          "
        >
          {description}
        </p>

        {/* FOOTER */}
        <div
          className="
            mt-6
            
            flex
            items-center
            gap-2
            
            text-emerald-500
            
            font-semibold
          "
        >
          <TrendingUp
            size={18}
          />

          <span>
            Growing steadily this month
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCard;