// src/components/common/Button.jsx

import React from "react";

const Button = ({
  text = "Button",
  type = "button",
  onClick,
  fullWidth = true,
  disabled = false,
  loading = false,
  icon: Icon,
  variant = "primary",
  className = "",
}) => {
  
  // BUTTON VARIANTS
  const variants = {
    primary: `
      bg-gradient-to-r
      from-teal-500
      via-cyan-500
      to-sky-500
      
      text-white
      
      hover:from-teal-600
      hover:via-cyan-600
      hover:to-sky-600
      
      shadow-[0_8px_24px_rgba(20,184,181,0.25)]
    `,

    secondary: `
      bg-white
      border
      border-gray-300
      
      text-slate-700
      
      hover:bg-gray-50
      hover:border-teal-400
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${fullWidth ? "w-full" : "w-auto"}

        relative
        overflow-hidden
        
        flex
        items-center
        justify-center
        gap-3
        
        px-6
        h-14
        md:h-[60px]
        
        rounded-2xl
        
        font-semibold
        text-base
        
        transition-all
        duration-300
        
        hover:scale-[1.02]
        active:scale-[0.98]
        
        disabled:opacity-60
        disabled:cursor-not-allowed
        
        before:absolute
        before:inset-0
        before:bg-white/10
        before:translate-x-[-100%]
        hover:before:translate-x-[100%]
        before:transition-transform
        before:duration-700
        
        ${variants[variant]}
        ${className}
      `}
    >
      
      {/* LOADING */}
      {loading ? (
        <div className="flex items-center gap-3 z-10">
          
          {/* SPINNER */}
          <div
            className="
              w-5
              h-5
              border-2
              border-white
              border-t-transparent
              rounded-full
              animate-spin
            "
          />

          <span>Loading...</span>
        </div>
      ) : (
        <>
          
          {/* ICON */}
          {Icon && (
            <Icon
              size={22}
              className="z-10"
            />
          )}

          {/* TEXT */}
          <span className="z-10">
            {text}
          </span>
        </>
      )}
    </button>
  );
};

export default Button;