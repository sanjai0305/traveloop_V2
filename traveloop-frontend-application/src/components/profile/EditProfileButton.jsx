// src/components/profile/EditProfileButton.jsx

import React from "react";

import { Pencil } from "lucide-react";

const EditProfileButton = () => {
  return (
    <button
      className="
        mt-6
        
        group
        
        flex
        items-center
        gap-3
        
        px-5
        py-3
        
        rounded-2xl
        
        bg-white
        
        border
        border-slate-200
        
        shadow-sm
        
        hover:border-teal-300
        hover:text-teal-600
        hover:shadow-md
        
        transition-all
        duration-300
      "
    >
      
      {/* ICON */}
      <div
        className="
          w-10
          h-10
          
          rounded-xl
          
          bg-gradient-to-br
          from-teal-500
          to-cyan-500
          
          text-white
          
          flex
          items-center
          justify-center
          
          transition-transform
          duration-300
          
          group-hover:scale-110
        "
      >
        <Pencil size={18} />
      </div>

      {/* TEXT */}
      <span
        className="
          font-semibold
          
          text-sm
          md:text-base
        "
      >
        Edit Profile
      </span>
    </button>
  );
};

export default EditProfileButton;