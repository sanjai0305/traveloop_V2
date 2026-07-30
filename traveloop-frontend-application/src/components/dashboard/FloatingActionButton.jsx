// src/components/dashboard/FloatingActionButton.jsx

import React from "react";
import { useLocation } from "react-router-dom";

import {
  Plus,
  Plane,
} from "lucide-react";

const FloatingActionButton = () => {
  const location = useLocation();

  const isAuthScreen = ["/", "/login", "/register", "/forgot-password", "/privacy", "/terms", "/terms-and-conditions"].some(
    path => location.pathname === path || location.pathname.startsWith(path + "/")
  );

  if (isAuthScreen) return null;

  // HANDLE CLICK
  const handleCreateTrip = () => {
    console.log("Create New Trip");
  };

  return (
    <div
      className="
        fixed
        bottom-6
        right-6
        
        z-50
      "
    >
      
      {/* FLOATING BUTTON */}
      <button
        onClick={handleCreateTrip}
        className="
          group
          relative
          
          flex
          items-center
          gap-4
          
          px-6
          py-4
          
          rounded-2xl
          
          bg-gradient-to-r
          from-teal-500
          via-cyan-500
          to-sky-500
          
          text-white
          
          shadow-[0_20px_40px_rgba(6,182,212,0.35)]
          
          hover:scale-105
          hover:shadow-[0_25px_50px_rgba(6,182,212,0.45)]
          
          transition-all
          duration-300
          
          overflow-hidden
        "
      >
        
        {/* BACKGROUND GLOW */}
        <div
          className="
            absolute
            inset-0
            
            bg-white/10
            
            opacity-0
            group-hover:opacity-100
            
            transition
            duration-500
          "
        />

        {/* ICON */}
        <div
          className="
            relative
            z-10
            
            flex
            items-center
            justify-center
            
            w-12
            h-12
            
            rounded-xl
            
            bg-white/15
            backdrop-blur-md
          "
        >
          <Plus
            size={24}
            className="
              transition-transform
              duration-300
              
              group-hover:rotate-90
            "
          />
        </div>

        {/* TEXT */}
        <div
          className="
            relative
            z-10
            
            hidden
            sm:flex
            
            flex-col
            items-start
          "
        >
          <span
            className="
              text-xs
              
              text-cyan-100
            "
          >
            Quick Action
          </span>

          <span
            className="
              text-base
              
              font-semibold
            "
          >
            Plan New Trip
          </span>
        </div>

        {/* PLANE ICON */}
        <Plane
          size={22}
          className="
            relative
            z-10
            
            hidden
            md:block
            
            rotate-[20deg]
            
            text-cyan-100
            
            transition-transform
            duration-500
            
            group-hover:translate-x-1
          "
        />
      </button>
    </div>
  );
};
export default FloatingActionButton;