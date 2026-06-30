// src/components/auth/AuthFooter.jsx

import React from "react";
import { Link } from "react-router-dom";

const AuthFooter = ({
  text = "Already have an account?",
  linkText = "Login",
  to = "/",
}) => {
  return (
    <div className="mt-8 text-center">
      
      <p
        className="
          text-slate-500
          text-sm
          md:text-base
        "
      >
        {text}{" "}
        
        <Link
          to={to}
          className="
            relative
            
            inline-block
            
            font-bold
            
            bg-gradient-to-r
            from-teal-600
            to-cyan-500
            
            bg-clip-text
            text-transparent
            
            hover:opacity-80
            
            transition-all
            duration-300
          "
        >
          {linkText}

          {/* UNDERLINE EFFECT */}
          <span
            className="
              absolute
              left-0
              bottom-[-2px]
              
              w-0
              h-[2px]
              
              bg-gradient-to-r
              from-teal-500
              to-cyan-500
              
              transition-all
              duration-300
              
              group-hover:w-full
            "
          />
        </Link>
      </p>
    </div>
  );
};

export default AuthFooter;