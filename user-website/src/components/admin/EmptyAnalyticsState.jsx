// src/components/admin/EmptyAnalyticsState.jsx

import React from "react";

import {
  BarChart3,
  Sparkles,
  RefreshCcw,
} from "lucide-react";

const EmptyAnalyticsState = () => {
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
        
        px-6
        md:px-10
        
        py-16
      "
    >
      
      {/* GLOW */}
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
            
            w-32
            h-32
            
            rounded-full
            
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            
            text-white
            
            shadow-[0_20px_50px_rgba(6,182,212,0.35)]
          "
        >
          <BarChart3
            size={58}
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
            Smart Analytics Dashboard
          </span>
        </div>

        {/* TITLE */}
        <h2
          className="
            mt-6
            
            text-4xl
            md:text-5xl
            
            font-extrabold
            
            text-slate-900
            
            leading-tight
          "
        >
          No Analytics Available
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-5
            
            max-w-3xl
            
            text-slate-500
            
            text-base
            md:text-lg
            
            leading-8
          "
        >
          Analytics data is currently unavailable.
          Please refresh the dashboard or try
          again later to load platform insights,
          user trends, bookings, and revenue
          reports.
        </p>

        {/* BUTTON */}
        <button
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
            
            transition-all
            duration-300
          "
        >
          
          {/* ICON */}
          <RefreshCcw
            size={24}
            className="
              transition-transform
              duration-500
              
              group-hover:rotate-180
            "
          />

          <span>
            Refresh Analytics
          </span>
        </button>
      </div>
    </div>
  );
};

export default EmptyAnalyticsState;