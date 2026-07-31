// src/components/activities/ActivityPrice.jsx

import React from "react";

import {
  ShieldCheck,
  BadgePercent,
} from "lucide-react";

const ActivityPrice = ({
  price,
  oldPrice,
}) => {
  
  // SAFE DISCOUNT CALCULATION
  const discountPercentage =
    oldPrice && price
      ? Math.round(
          ((oldPrice - price) /
            oldPrice) *
            100
        )
      : 0;

  return (
    <div
      className="
        flex
        flex-col
        
        gap-3
      "
    >
      
      {/* LABEL */}
      <span
        className="
          text-xs
          md:text-sm
          
          font-bold
          
          text-slate-400
          
          uppercase
          
          tracking-[3px]
        "
      >
        Starting From
      </span>

      {/* PRICE ROW */}
      <div
        className="
          flex
          flex-wrap
          
          items-end
          
          gap-4
        "
      >
        
        {/* CURRENT PRICE */}
        <div
          className="
            flex
            items-end
            gap-1
          "
        >
          <span
            className="
              text-2xl
              md:text-3xl
              
              font-bold
              
              text-slate-500
            "
          >
            $
          </span>

          <h3
            className="
              text-4xl
              md:text-5xl
              
              font-extrabold
              
              text-slate-900
              
              leading-none
            "
          >
            {price}
          </h3>
        </div>

        {/* OLD PRICE */}
        {oldPrice && (
          <span
            className="
              text-xl
              
              text-slate-400
              
              line-through
              
              mb-1
            "
          >
            ${oldPrice}
          </span>
        )}

        {/* DISCOUNT */}
        {discountPercentage > 0 && (
          <div
            className="
              flex
              items-center
              gap-2
              
              px-4
              py-2
              
              rounded-full
              
              bg-gradient-to-r
              from-emerald-500
              to-green-500
              
              text-white
              
              text-sm
              
              font-bold
              
              shadow-lg
              
              mb-1
            "
          >
            <BadgePercent
              size={16}
            />

            <span>
              {discountPercentage}% OFF
            </span>
          </div>
        )}
      </div>

      {/* EXTRA INFO */}
      <div
        className="
          flex
          flex-wrap
          
          items-center
          
          gap-3
        "
      >
        
        {/* SAFETY BADGE */}
        <div
          className="
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
          <ShieldCheck
            size={16}
          />

          <span>
            Safety Gear Included
          </span>
        </div>

        {/* TEXT */}
        <p
          className="
            text-slate-500
            
            text-sm
            
            font-medium
          "
        >
          Instructor & insurance included
        </p>
      </div>
    </div>
  );
};

export default ActivityPrice;