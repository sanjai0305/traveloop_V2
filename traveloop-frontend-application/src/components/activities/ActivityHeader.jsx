// src/components/activities/ActivityHeader.jsx

import React from "react";

import {
  Bell,
  ChevronDown,
  Compass,
  Sparkles,
} from "lucide-react";

// IMAGE
import UserProfile from "../../assets/images/user-profile.jpg";

const ActivityHeader = () => {
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
          
          h-[92px]
          
          flex
          items-center
          justify-between
        "
      >
        
        {/* LEFT SIDE */}
        <div
          className="
            flex
            items-center
            gap-4
          "
        >
          
          {/* LOGO */}
          <div
            className="
              relative
              
              w-16
              h-16
              
              rounded-3xl
              
              bg-gradient-to-br
              from-teal-500
              via-cyan-500
              to-sky-500
              
              flex
              items-center
              justify-center
              
              shadow-[0_15px_35px_rgba(6,182,212,0.35)]
            "
          >
            
            {/* GLOW */}
            <div
              className="
                absolute
                inset-0
                
                rounded-3xl
                
                bg-white/10
              "
            />

            {/* ICON */}
            <Compass
              size={32}
              className="
                relative
                z-10
                
                text-white
              "
            />
          </div>

          {/* BRAND */}
          <div>
            
            <h1
              className="
                text-3xl
                md:text-4xl
                
                font-extrabold
                
                bg-gradient-to-r
                from-slate-900
                to-slate-700
                
                bg-clip-text
                text-transparent
                
                tracking-tight
              "
            >
              Traveloop
            </h1>

            <div
              className="
                flex
                items-center
                gap-2
                
                mt-1
              "
            >
              <Sparkles
                size={14}
                className="
                  text-teal-500
                "
              />

              <p
                className="
                  text-xs
                  md:text-sm
                  
                  font-medium
                  
                  tracking-[3px]
                  
                  uppercase
                  
                  text-slate-400
                "
              >
                Explore Experiences
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div
          className="
            flex
            items-center
            gap-5
          "
        >
          
          {/* NOTIFICATION */}
          <button
            className="
              relative
              
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
              hover:shadow-md
              
              transition-all
              duration-300
            "
          >
            
            {/* ICON */}
            <Bell
              className="
                w-6
                h-6
                
                text-slate-700
              "
            />

            {/* RED DOT */}
            <span
              className="
                absolute
                top-3
                right-3
                
                w-3
                h-3
                
                bg-red-500
                
                rounded-full
                
                border-2
                border-white
              "
            />
          </button>

          {/* PROFILE */}
          <button
            className="
              flex
              items-center
              gap-4
              
              px-4
              py-2
              
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
            
            {/* IMAGE */}
            <div className="relative">
              
              <img
                src={UserProfile}
                alt="User"
                className="
                  w-14
                  h-14
                  
                  rounded-full
                  
                  object-cover
                  
                  border-2
                  border-teal-500
                  
                  shadow-md
                "
              />

              {/* ONLINE DOT */}
              <span
                className="
                  absolute
                  bottom-1
                  right-1
                  
                  w-4
                  h-4
                  
                  rounded-full
                  
                  bg-emerald-500
                  
                  border-2
                  border-white
                "
              />
            </div>

            {/* USER INFO */}
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
                Welcome Back
              </span>

              <h3
                className="
                  text-lg
                  
                  font-bold
                  
                  text-slate-800
                "
              >
                Hi, Arjun
              </h3>
            </div>

            {/* DROPDOWN */}
            <ChevronDown
              className="
                w-5
                h-5
                
                text-slate-600
              "
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default ActivityHeader;