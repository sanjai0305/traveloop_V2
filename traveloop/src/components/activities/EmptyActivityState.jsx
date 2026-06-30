// src/components/activities/EmptyActivityState.jsx

import React from "react";

import {
  SearchX,
  RefreshCcw,
  Sparkles,
  Compass,
} from "lucide-react";

const EmptyActivityState = ({
  onReset,
}) => {
  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        w-full
        
        bg-white
        
        border
        border-slate-200
        
        rounded-[36px]
        
        px-6
        md:px-10
        
        py-16
        
        shadow-sm
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
            relative
            
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
          
          {/* INNER GLOW */}
          <div
            className="
              absolute
              inset-0
              
              rounded-full
              
              bg-white/10
            "
          />

          <SearchX
            className="
              w-16
              h-16
              
              relative
              z-10
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
            AI Powered Search Suggestions
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
            
            tracking-tight
            
            leading-tight
          "
        >
          No Activities Found
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-5
            
            max-w-3xl
            
            text-base
            md:text-lg
            
            text-slate-500
            
            leading-8
          "
        >
          We couldn’t find any activities
          matching your current search or filters.
          Try changing keywords, adjusting filters,
          or exploring nearby destinations to
          discover new adventures.
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
          
          {/* CARD */}
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
              <Compass size={24} />
            </div>

            {/* TEXT */}
            <div className="text-left">
              <h3
                className="
                  text-2xl
                  
                  font-bold
                  
                  text-slate-800
                "
              >
                500+
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Activities Available
              </p>
            </div>
          </div>

          {/* CARD */}
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
              <Sparkles size={24} />
            </div>

            {/* TEXT */}
            <div className="text-left">
              <h3
                className="
                  text-2xl
                  
                  font-bold
                  
                  text-slate-800
                "
              >
                AI
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Smart Recommendations
              </p>
            </div>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={onReset}
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
          <RefreshCcw
            className="
              w-5
              h-5
              
              transition-transform
              duration-500
              
              group-hover:rotate-180
            "
          />

          <span>
            Reset Filters
          </span>
        </button>
      </div>
    </div>
  );
};

export default EmptyActivityState;