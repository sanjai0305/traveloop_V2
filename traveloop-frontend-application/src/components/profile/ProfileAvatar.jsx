// src/components/profile/ProfileAvatar.jsx

import React from "react";

import { Camera } from "lucide-react";

const ProfileAvatar = ({ image }) => {
  return (
    <div
      className="
        relative
        
        w-44
        h-44
        
        rounded-full
        
        bg-gradient-to-br
        from-teal-500
        to-cyan-500
        
        p-1
        
        shadow-[0_20px_50px_rgba(6,182,212,0.35)]
      "
    >
      
      {/* IMAGE WRAPPER */}
      <div
        className="
          w-full
          h-full
          
          rounded-full
          
          bg-white
          
          overflow-hidden
          
          flex
          items-center
          justify-center
        "
      >
        <img
          src={image}
          alt="Profile"
          className="
            w-full
            h-full
            
            object-cover
          "
        />
      </div>

      {/* CAMERA ICON */}
      <button
        className="
          absolute
          bottom-2
          right-2
          
          w-12
          h-12
          
          rounded-full
          
          bg-gradient-to-br
          from-teal-500
          to-cyan-500
          
          text-white
          
          flex
          items-center
          justify-center
          
          shadow-lg
          
          hover:scale-110
          
          transition-all
          duration-300
        "
      >
        <Camera size={20} />
      </button>
    </div>
  );
};

export default ProfileAvatar;