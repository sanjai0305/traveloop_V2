// src/components/common/TextAreaField.jsx

import React from "react";

const TextAreaField = ({
  label,
  name,
  value,
  onChange,
  placeholder = "Enter text...",
  icon: Icon,
  required = false,
  disabled = false,
  error = "",
  rows = 5,
  maxLength,
}) => {
  return (
    <div className="w-full">
      
      {/* LABEL + CHARACTER COUNT */}
      <div className="flex items-center justify-between mb-3">
        
        {/* LABEL */}
        {label && (
          <label
            className="
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

        {/* CHARACTER COUNT */}
        {maxLength && (
          <span
            className="
              text-xs
              text-slate-400
            "
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {/* TEXTAREA WRAPPER */}
      <div
        className={`
          group
          relative
          
          flex
          items-start
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
              pt-1
              
              text-teal-500
              
              transition
              duration-300
              
              group-focus-within:text-teal-600
              group-focus-within:scale-110
            "
          >
            <Icon size={22} />
          </div>
        )}

        {/* TEXTAREA */}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className="
            w-full
            
            resize-none
            
            bg-transparent
            outline-none
            
            text-slate-700
            text-base
            md:text-lg
            
            placeholder:text-slate-400
            
            font-medium
            
            leading-7
          "
        />

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

export default TextAreaField;