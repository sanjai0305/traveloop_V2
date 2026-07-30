// src/components/common/InputField.jsx

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const InputField = ({
  label,
  type = "text",
  placeholder = "Enter value",
  icon: Icon,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  error = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="w-full">
      
      {/* LABEL */}
      {label && (
        <label
          className="
            block
            mb-1
            
            text-xs
            md:text-sm
            
            font-semibold
            text-slate-700
            
            tracking-wide
          "
        >
          {label}
        </label>
      )}

      {/* INPUT WRAPPER */}
      <div
        className={`
          group
          relative
          
          flex
          items-center
          gap-3
          
          px-4
          h-14
          md:h-[60px]
          
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
            <Icon size={20} />
          </div>
        )}

        {/* INPUT FIELD */}
        <input
          type={
            isPassword
              ? showPassword
                ? "text"
                : "password"
              : type
          }
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className="
            w-full
            
            bg-transparent
            outline-none
            
            text-slate-700
            text-sm
            md:text-base
            
            placeholder:text-slate-400
            
            font-medium
          "
        />

        {/* PASSWORD TOGGLE */}
        {isPassword && (
          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="
              flex
              items-center
              justify-center
              
              text-slate-400
              hover:text-teal-600
              
              transition
              duration-300
            "
          >
            {showPassword ? (
              <EyeOff size={22} />
            ) : (
              <Eye size={22} />
            )}
          </button>
        )}

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

      {/* ERROR MESSAGE */}
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

export default InputField;