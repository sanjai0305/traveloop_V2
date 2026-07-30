// src/components/itineraryView/ExpenseCard.jsx

import React from "react";

import {
  IndianRupee,
  Wallet,
  TrendingUp,
} from "lucide-react";

const ExpenseCard = ({
  price = "0",
}) => {
  return (
    <div
      className="
        flex
        items-center
        gap-5
        
        px-6
        py-5
        
        rounded-[28px]
        
        bg-white
        
        border
        border-slate-200
        
        shadow-sm
        
        hover:shadow-md
        
        transition-all
        duration-300
      "
    >
      
      {/* ICON */}
      <div
        className="
          w-16
          h-16
          
          rounded-3xl
          
          bg-gradient-to-br
          from-teal-500
          to-cyan-500
          
          text-white
          
          flex
          items-center
          justify-center
          
          shadow-[0_12px_30px_rgba(6,182,212,0.35)]
        "
      >
        <Wallet size={30} />
      </div>

      {/* CONTENT */}
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
            size={14}
            className="
              text-emerald-500
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
            Estimated Expense
          </p>
        </div>

        {/* PRICE */}
        <div
          className="
            mt-3
            
            flex
            items-end
            gap-1
          "
        >
          <IndianRupee
            size={24}
            className="
              text-slate-700
              
              mb-1
            "
          />

          <h3
            className="
              text-3xl
              
              font-extrabold
              
              text-slate-900
              
              leading-none
            "
          >
            {price}
          </h3>
        </div>

        {/* SUBTEXT */}
        <p
          className="
            mt-2
            
            text-sm
            
            text-slate-500
            
            font-medium
          "
        >
          Includes taxes & booking charges
        </p>
      </div>
    </div>
  );
};

export default ExpenseCard;