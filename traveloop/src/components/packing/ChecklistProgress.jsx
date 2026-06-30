// src/components/packing/ChecklistProgress.jsx

import React from "react";

import {
  CheckCircle2,
  Circle,
  TrendingUp,
} from "lucide-react";

const ChecklistProgress = () => {
  
  // DATA
  const totalItems = 12;
  const packedItems = 5;

  // PERCENTAGE
  const percentage = Math.round(
    (packedItems / totalItems) * 100
  );

  return (
    <div
      className="
        relative
        
        overflow-hidden
        
        bg-white
        
        border
        border-slate-200
        
        rounded-[34px]
        
        shadow-sm
        
        p-7
      "
    >
      
      {/* GLOW */}
      <div
        className="
          absolute
          bottom-[-100px]
          right-[-100px]
          
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
            flex-col
            lg:flex-row
            
            items-start
            lg:items-center
            
            justify-between
            
            gap-5
          "
        >
          
          {/* LEFT */}
          <div>
            
            {/* LABEL */}
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <TrendingUp
                size={16}
                className="
                  text-teal-500
                "
              />

              <p
                className="
                  text-xs
                  
                  uppercase
                  
                  tracking-[2px]
                  
                  text-slate-400
                  
                  font-semibold
                "
              >
                Packing Progress
              </p>
            </div>

            {/* TITLE */}
            <h2
              className="
                mt-4
                
                text-3xl
                md:text-4xl
                
                font-extrabold
                
                text-slate-900
              "
            >
              {packedItems} / {totalItems} Items Packed
            </h2>

            {/* DESCRIPTION */}
            <p
              className="
                mt-3
                
                text-slate-500
                
                text-base
                
                leading-7
              "
            >
              Keep track of all essentials
              and never miss an important item.
            </p>
          </div>

          {/* RIGHT */}
          <div
            className="
              flex
              items-center
              gap-5
            "
          >
            
            {/* PACKED */}
            <div
              className="
                flex
                items-center
                gap-3
                
                px-5
                py-4
                
                rounded-3xl
                
                bg-emerald-50
                
                border
                border-emerald-100
              "
            >
              <CheckCircle2
                size={24}
                className="
                  text-emerald-500
                "
              />

              <div>
                <h3
                  className="
                    text-2xl
                    
                    font-extrabold
                    
                    text-emerald-600
                  "
                >
                  {packedItems}
                </h3>

                <p
                  className="
                    text-sm
                    
                    text-emerald-500
                  "
                >
                  Packed
                </p>
              </div>
            </div>

            {/* REMAINING */}
            <div
              className="
                flex
                items-center
                gap-3
                
                px-5
                py-4
                
                rounded-3xl
                
                bg-orange-50
                
                border
                border-orange-100
              "
            >
              <Circle
                size={24}
                className="
                  text-orange-500
                "
              />

              <div>
                <h3
                  className="
                    text-2xl
                    
                    font-extrabold
                    
                    text-orange-500
                  "
                >
                  {totalItems - packedItems}
                </h3>

                <p
                  className="
                    text-sm
                    
                    text-orange-500
                  "
                >
                  Remaining
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-8">
          
          {/* LABEL ROW */}
          <div
            className="
              flex
              items-center
              justify-between
              
              mb-3
            "
          >
            <span
              className="
                text-sm
                
                font-medium
                
                text-slate-500
              "
            >
              Packing Completion
            </span>

            <span
              className="
                text-sm
                
                font-bold
                
                text-slate-700
              "
            >
              {percentage}%
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
                width: `${percentage}%`,
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
      </div>
    </div>
  );
};

export default ChecklistProgress;