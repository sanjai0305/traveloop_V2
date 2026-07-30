// src/components/profile/ProfileStats.jsx

import React from "react";

const ProfileStats = () => {
  return (
    <div
      className="
        flex
        flex-col
        gap-4
      "
    >
      
      {/* STAT CARD */}
      <div
        className="
          px-6
          py-5
          
          rounded-3xl
          
          bg-gradient-to-r
          from-teal-500
          to-cyan-500
          
          text-white
          
          shadow-[0_15px_40px_rgba(6,182,212,0.35)]
        "
      >
        <h3
          className="
            text-3xl
            font-extrabold
          "
        >
          18
        </h3>

        <p
          className="
            text-sm
            opacity-80
            mt-1
          "
        >
          Trips Completed
        </p>
      </div>

      {/* STAT CARD */}
      <div
        className="
          px-6
          py-5
          
          rounded-3xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        <h3
          className="
            text-3xl
            font-extrabold
            text-slate-800
          "
        >
          12
        </h3>

        <p
          className="
            text-sm
            text-slate-500
            mt-1
          "
        >
          Countries Visited
        </p>
      </div>

      {/* STAT CARD */}
      <div
        className="
          px-6
          py-5
          
          rounded-3xl
          
          bg-white
          
          border
          border-slate-200
          
          shadow-sm
        "
      >
        <h3
          className="
            text-3xl
            font-extrabold
            text-slate-800
          "
        >
          4.9
        </h3>

        <p
          className="
            text-sm
            text-slate-500
            mt-1
          "
        >
          Avg Travel Rating
        </p>
      </div>
    </div>
  );
};

export default ProfileStats;