// src/components/trip/BackButton.jsx

import React from "react";

import {
  ArrowLeft,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

const BackButton = ({
  text = "Go Back",
  to,
}) => {
  
  const navigate = useNavigate();

  // HANDLE BACK
  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="
        group
        
        flex
        items-center
        gap-3
        
        px-5
        py-4
        
        rounded-2xl
        
        bg-white
        
        border
        border-slate-200
        
        shadow-sm
        
        hover:border-teal-300
        hover:shadow-md
        
        transition-all
        duration-300
      "
    >
      
      {/* ICON WRAPPER */}
      <div
        className="
          flex
          items-center
          justify-center
          
          w-11
          h-11
          
          rounded-xl
          
          bg-gradient-to-br
          from-teal-500
          to-cyan-500
          
          text-white
          
          shadow-md
        "
      >
        <ArrowLeft
          size={20}
          className="
            transition-transform
            duration-300
            
            group-hover:-translate-x-1
          "
        />
      </div>

      {/* TEXT */}
      <div
        className="
          hidden
          sm:flex
          
          flex-col
          items-start
        "
      >
        <span
          className="
            text-xs
            
            text-slate-400
          "
        >
          Navigation
        </span>

        <span
          className="
            text-sm
            md:text-base
            
            font-semibold
            
            text-slate-700
          "
        >
          {text}
        </span>
      </div>
    </button>
  );
};

export default BackButton;