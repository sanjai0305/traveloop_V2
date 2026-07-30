// src/components/itinerary/DateRangeField.jsx

import React from "react";

import {
  CalendarDays,
} from "lucide-react";

const DateRangeField = ({
  label = "Date Range",
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
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

      {/* WRAPPER */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          
          gap-5
        "
      >
        
        {/* START DATE */}
        <div
          className="
            group
            
            flex
            items-center
            gap-4
            
            px-5
            py-4
            
            rounded-2xl
            
            border
            border-slate-200
            
            bg-white
            
            shadow-sm
            
            transition-all
            duration-300
            
            hover:border-teal-300
            
            focus-within:border-teal-500
            focus-within:ring-4
            focus-within:ring-teal-100
          "
        >
          
          {/* ICON */}
          <CalendarDays
            size={22}
            className="
              text-teal-500
            "
          />

          {/* INPUT */}
          <input
            type="date"
            value={startDate}
            onChange={onStartDateChange}
            className="
              w-full
              
              outline-none
              
              text-slate-700
              
              font-medium
            "
          />
        </div>

        {/* END DATE */}
        <div
          className="
            group
            
            flex
            items-center
            gap-4
            
            px-5
            py-4
            
            rounded-2xl
            
            border
            border-slate-200
            
            bg-white
            
            shadow-sm
            
            transition-all
            duration-300
            
            hover:border-cyan-300
            
            focus-within:border-cyan-500
            focus-within:ring-4
            focus-within:ring-cyan-100
          "
        >
          
          {/* ICON */}
          <CalendarDays
            size={22}
            className="
              text-cyan-500
            "
          />

          {/* INPUT */}
          <input
            type="date"
            value={endDate}
            onChange={onEndDateChange}
            className="
              w-full
              
              outline-none
              
              text-slate-700
              
              font-medium
            "
          />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <p
          className="
            mt-3
            
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

export default DateRangeField;