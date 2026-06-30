// src/components/packing/PackingHeader.jsx

import React from "react";

import {
  Backpack,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const PackingHeader = () => {
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
        
        py-8
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
      <div className="relative z-10">
        
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
          <Sparkles size={16} />

          <span>
            Smart Travel Packing
          </span>
        </div>

        {/* TITLE */}
        <h1
          className="
            mt-5
            
            text-4xl
            md:text-5xl
            
            font-extrabold
            
            text-slate-900
            
            leading-tight
          "
        >
          Packing{" "}
          
          <span
            className="
              bg-gradient-to-r
              from-teal-500
              to-cyan-500
              
              bg-clip-text
              text-transparent
            "
          >
            Checklist
          </span>
        </h1>

        {/* DESCRIPTION */}
        <p
          className="
            mt-4
            
            max-w-3xl
            
            text-slate-500
            
            text-base
            md:text-lg
            
            leading-8
          "
        >
          Organize all your travel essentials,
          documents, clothing, gadgets, and
          accessories with a beautiful smart
          checklist system.
        </p>

        {/* STATS */}
        <div
          className="
            flex
            flex-wrap
            
            items-center
            
            gap-5
            
            mt-8
          "
        >
          
          {/* ITEMS */}
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
              <Backpack size={26} />
            </div>

            {/* TEXT */}
            <div>
              <h3
                className="
                  text-3xl
                  
                  font-extrabold
                  
                  text-slate-900
                "
              >
                12
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Checklist Items
              </p>
            </div>
          </div>

          {/* PACKED */}
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
              <CheckCircle2 size={26} />
            </div>

            {/* TEXT */}
            <div>
              <h3
                className="
                  text-3xl
                  
                  font-extrabold
                  
                  text-slate-900
                "
              >
                42%
              </h3>

              <p
                className="
                  text-sm
                  
                  text-slate-500
                "
              >
                Packed Completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackingHeader;