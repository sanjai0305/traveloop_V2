// src/components/common/SelectField.jsx

import React from "react";
import { ChevronDown } from "lucide-react";

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  icon: Icon,
  required = false,
  disabled = false,
  error = "",
  placeholder = "Select an option",
}) => {
  return (
    <div className="w-full">
      
      {/* LABEL */}
      {label && (
        <label
          className="
            block
            mb-3
            
            text-sm
            md:text-base
            
            font-semibold
            text-slate-700
            
            tracking-wide
          "
        >
          {label}
        </label>
      )}

      {/* SELECT WRAPPER */}
      <div
        className={`
          group
          relative
          
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
          
          bg-white/90
          backdrop-blur-md
          
          shadow-sm
          
          transition-all
          duration-300
          
          hover:border-teal-300
          
          focus-within:border-teal-500
          focus-within:ring-4
          focus-within:ring-teal-100
          focus-within:shadow-lg
          
          ${
            disabled
              ? "opacity-60 cursor-not-allowed"
              : ""
          }
        `}
      >
        
        {/* LEFT ICON */}
        {Icon && (
          <div
            className="
              flex
              items-center
              justify-center
              
              text-teal-500
              
              transition
              duration-300
              
              group-focus-within:scale-110
              group-focus-within:text-teal-600
            "
          >
            <Icon size={22} />
          </div>
        )}

        {/* SELECT */}
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="
            w-full
            
            bg-transparent
            outline-none
            
            text-slate-700
            text-base
            md:text-lg
            
            font-medium
            
            appearance-none
            
            cursor-pointer
          "
        >
          
          {/* PLACEHOLDER */}
          <option value="">
            {placeholder}
          </option>

          {/* OPTIONS */}
          {options.map((option, index) => (
            <option
              key={index}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        {/* DROPDOWN ICON */}
        <div
          className="
            absolute
            right-5
            
            text-slate-400
            pointer-events-none
            
            group-focus-within:text-teal-500
            
            transition
          "
        >
          <ChevronDown size={22} />
        </div>

        {/* GLOW EFFECT */}
        <div
          className="
            absolute
            inset-0
            
            rounded-2xl
            
            bg-gradient-to-r
            from-teal-500/0
            via-cyan-500/0
            to-sky-500/0
            
            opacity-0
            group-focus-within:opacity-100
            
            transition
            duration-500
            
            pointer-events-none
          "
        />
      </div>

      {/* ERROR */}
      {error && (
        <p
          className="
            mt-2
            ml-1
            
            text-sm
            text-red-500
            font-medium
          "
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default SelectField;