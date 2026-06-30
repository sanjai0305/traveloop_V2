// src/components/itinerary/SectionCard.jsx

import React from "react";

import {
  CalendarDays,
  IndianRupee,
  Pencil,
  MoreVertical,
} from "lucide-react";

const SectionCard = ({
  sectionNumber = 1,
  title = "Section Title",
  description = "Add your itinerary details, activities, hotel stays, transport information, and schedules for this section.",
  startDate = "",
  endDate = "",
  budget = "",
  onDateChange,
  onBudgetChange,
}) => {
  return (
    <div
      className="
        bg-white
        
        border
        border-slate-200
        
        rounded-[34px]
        
        shadow-sm
        
        overflow-hidden
        
        transition-all
        duration-300
        
        hover:shadow-lg
      "
    >
      
      {/* TOP */}
      <div
        className="
          flex
          flex-col
          xl:flex-row
          
          items-start
          xl:items-center
          
          justify-between
          
          gap-6
          
          px-6
          md:px-8
          
          py-7
        "
      >
        
        {/* LEFT SIDE */}
        <div
          className="
            flex
            items-start
            gap-5
          "
        >
          
          {/* NUMBER */}
          <div
            className="
              min-w-[56px]
              min-h-[56px]
              
              rounded-2xl
              
              bg-gradient-to-br
              from-teal-500
              to-cyan-500
              
              text-white
              
              flex
              items-center
              justify-center
              
              text-xl
              
              font-bold
              
              shadow-lg
            "
          >
            {sectionNumber}
          </div>

          {/* CONTENT */}
          <div>
            
            {/* TITLE */}
            <h2
              className="
                text-2xl
                md:text-3xl
                
                font-bold
                
                text-slate-800
              "
            >
              {title}
            </h2>

            {/* DESCRIPTION */}
            <p
              className="
                mt-3
                
                max-w-3xl
                
                text-slate-500
                
                text-sm
                md:text-base
                
                leading-7
              "
            >
              {description}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          
          {/* EDIT BUTTON */}
          <button
            className="
              w-14
              h-14
              
              rounded-2xl
              
              bg-white
              
              border
              border-slate-200
              
              flex
              items-center
              justify-center
              
              shadow-sm
              
              hover:border-teal-300
              hover:text-teal-600
              
              transition-all
              duration-300
            "
          >
            <Pencil size={22} />
          </button>

          {/* MENU BUTTON */}
          <button
            className="
              w-14
              h-14
              
              rounded-2xl
              
              bg-white
              
              border
              border-slate-200
              
              flex
              items-center
              justify-center
              
              shadow-sm
              
              hover:border-slate-300
              
              transition-all
              duration-300
            "
          >
            <MoreVertical size={22} />
          </button>
        </div>
      </div>

      {/* FORM */}
      <div
        className="
          px-6
          md:px-8
          
          pb-8
          
          grid
          grid-cols-1
          xl:grid-cols-2
          
          gap-7
        "
      >
        
        {/* DATE RANGE */}
        <div>
          
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
            Date Range
          </label>

          {/* INPUT */}
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

            {/* DATE INPUT */}
            <input
              type="text"
              value={
                startDate && endDate
                  ? `${startDate} - ${endDate}`
                  : ""
              }
              onChange={onDateChange}
              placeholder="Select start date - Select end date"
              className="
                w-full
                
                outline-none
                
                text-slate-700
                
                font-medium
                
                placeholder:text-slate-400
              "
            />
          </div>
        </div>

        {/* BUDGET */}
        <div>
          
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
            Budget Of This Section
          </label>

          {/* INPUT */}
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
            <IndianRupee
              size={22}
              className="
                text-cyan-500
              "
            />

            {/* BUDGET INPUT */}
            <input
              type="number"
              value={budget}
              onChange={onBudgetChange}
              placeholder="Enter budget amount"
              className="
                w-full
                
                outline-none
                
                text-slate-700
                
                font-medium
                
                placeholder:text-slate-400
              "
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionCard;