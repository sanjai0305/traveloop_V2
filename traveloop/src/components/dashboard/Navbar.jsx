// src/components/dashboard/Navbar.jsx

import React from "react";

import {
  Bell,
  Menu,
} from "lucide-react";

// COMPONENTS
import Logo from "../common/Logo";
import UserMenu from "./UserMenu";

const Navbar = () => {
  return (
    <header
      className="
        sticky
        top-0
        z-50
        
        w-full
        
        bg-white/85
        backdrop-blur-xl
        
        border-b
        border-slate-200
        
        shadow-sm
      "
    >
      
      {/* CONTAINER */}
      <div
        className="
          max-w-[1600px]
          mx-auto
          
          px-4
          sm:px-6
          lg:px-8
          
          h-[88px]
          
          flex
          items-center
          justify-between
        "
      >
        
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4">
          
          {/* MOBILE MENU */}
          <button
            className="
              lg:hidden
              
              w-11
              h-11
              
              rounded-xl
              
              bg-white
              
              border
              border-slate-200
              
              flex
              items-center
              justify-center
              
              shadow-sm
            "
          >
            <Menu
              size={22}
              className="text-slate-700"
            />
          </button>

          {/* LOGO */}
          <div className="scale-[0.82] origin-left">
            <Logo />
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-4">
          
          {/* NOTIFICATION */}
          <button
            className="
              relative
              
              w-12
              h-12
              
              rounded-2xl
              
              bg-white
              
              border
              border-slate-200
              
              flex
              items-center
              justify-center
              
              shadow-sm
              
              hover:border-teal-300
              hover:shadow-md
              
              transition-all
              duration-300
            "
          >
            
            {/* ICON */}
            <Bell
              size={22}
              className="text-slate-700"
            />

            {/* DOT */}
            <span
              className="
                absolute
                top-3
                right-3
                
                w-2.5
                h-2.5
                
                rounded-full
                
                bg-red-500
                
                border-2
                border-white
              "
            />
          </button>

          {/* USER MENU */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Navbar;