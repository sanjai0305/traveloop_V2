// src/components/profile/ProfileHeader.jsx

import React from "react";

import {
  User,
  Bell,
  ChevronDown,
} from "lucide-react";

const ProfileHeader = () => {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        
        bg-white
        
        border
        border-slate-200
        
        rounded-[34px]
        
        px-6
        md:px-10
        
        py-5
        
        shadow-sm
      "
    >
      
      {/* LEFT */}
      <div
        className="
          flex
          items-center
          gap-4
        "
      >
        
        {/* ICON */}
        <div
          className="
            w-12
            h-12
            
            rounded-2xl
            
            bg-gradient-to-br
            from-teal-500
            to-cyan-500
            
            text-white
            
            flex
            items-center
            justify-center
          "
        >
          <User size={22} />
        </div>

        {/* TEXT */}
        <div>
          <h2
            className="
              text-xl
              md:text-2xl
              
              font-bold
              
              text-slate-800
            "
          >
            Profile
          </h2>

          <p
            className="
              text-sm
              
              text-slate-500
            "
          >
            Manage your account details and travel preferences
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div
        className="
          flex
          items-center
          gap-4
        "
      >
        
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
            
            transition-all
            duration-300
          "
        >
          <Bell size={20} />

          <span
            className="
              absolute
              top-3
              right-3
              
              w-2
              h-2
              
              bg-red-500
              
              rounded-full
            "
          />
        </button>

        {/* DROPDOWN */}
        <button
          className="
            flex
            items-center
            gap-3
            
            px-4
            py-2
            
            rounded-2xl
            
            bg-white
            
            border
            border-slate-200
            
            shadow-sm
            
            hover:border-teal-300
            
            transition-all
            duration-300
          "
        >
          
          {/* AVATAR */}
          <div
            className="
              w-10
              h-10
              
              rounded-full
              
              bg-gradient-to-br
              from-cyan-500
              to-teal-500
              
              flex
              items-center
              justify-center
              
              text-white
              
              font-bold
            "
          >
            A
          </div>

          {/* NAME */}
          <span
            className="
              hidden
              sm:block
              
              text-sm
              
              font-semibold
              
              text-slate-700
            "
          >
            Arjun Sharma
          </span>

          {/* ICON */}
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;