// src/components/itinerary/BudgetField.jsx

import React from "react";

import {
  IndianRupee,
} from "lucide-react";

const BudgetField = ({
  label = "Budget",
  value,
  onChange,
  placeholder = "Enter budget amount",
  error = "",
}) => {
  return (
    <div className="w-full">
      
      {/* LABEL */}
      <label
        className="
          block
          mb-3
          
          text-sm
          md:text-base
          
          font-semibold
          
          text-slate-700
        "
      >
        {label}
      </label>

      {/* INPUT WRAPPER */}
      <div
        className={`
          group
          
          flex
          items-center
          gap-4
          
          px-5
          py-4
          
          rounded-2xl
          
          border
          
          ${
            error
              ? "border-red-400"
              : "border-slate-200"
          }
          
          bg-white
          
          shadow-sm
          
          transition-all
          duration-300
          
          hover:border-teal-300
          
          focus-within:border-teal-500
          focus-within:ring-4
          focus-within:ring-teal-100
        `}
      >
        
        {/* ICON */}
        <IndianRupee
          size={22}
          className="
            text-teal-500
            
            transition-transform
            duration-300
            
            group-focus-within:scale-110
          "
        />

        {/* INPUT */}
        <input
          type="number"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="
            w-full
            
            bg-transparent
            outline-none
            
            text-slate-700
            
            text-base
            md:text-lg
            
            font-medium
            
            placeholder:text-slate-400
          "
        />
      </div>

      {/* ERROR */}
      {error && (
        <p
          className="
            mt-2
            
            text-sm
            
            text-red-500
          "
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default BudgetField;