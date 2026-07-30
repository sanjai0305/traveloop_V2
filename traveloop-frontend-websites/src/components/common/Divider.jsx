// src/components/common/Divider.jsx

import React from "react";

const Divider = ({ text = "OR CONTINUE WITH" }) => {
  return (
    <div
      className="
        relative
        flex
        items-center
        justify-center
        w-full
        my-8
      "
    >
      
      {/* LEFT LINE */}
      <div
        className="
          flex-1
          h-[1px]
          bg-gradient-to-r
          from-transparent
          via-gray-300
          to-gray-200
        "
      />

      {/* CENTER TEXT */}
      <div
        className="
          px-5
          py-2
          mx-4
          
          text-xs
          md:text-sm
          
          font-semibold
          tracking-[3px]
          uppercase
          
          text-gray-500
          
          bg-white/90
          
          rounded-full
          
          border
          border-gray-200
          
          shadow-sm
          backdrop-blur-md
        "
      >
        {text}
      </div>

      {/* RIGHT LINE */}
      <div
        className="
          flex-1
          h-[1px]
          bg-gradient-to-l
          from-transparent
          via-gray-300
          to-gray-200
        "
      />
    </div>
  );
};

export default Divider;