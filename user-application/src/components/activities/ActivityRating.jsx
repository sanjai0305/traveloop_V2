// src/components/activities/ActivityRating.jsx

import React from "react";

import {
  Star,
  TrendingUp,
} from "lucide-react";

const ActivityRating = ({
  rating = 4.8,
  reviews = "1.2k",
}) => {
  return (
    <div
      className="
        flex
        items-center
        gap-4
        
        flex-wrap
      "
    >
      
      {/* STAR BOX */}
      <div
        className="
          flex
          items-center
          justify-center
          
          w-12
          h-12
          
          rounded-2xl
          
          bg-gradient-to-br
          from-yellow-400
          to-orange-500
          
          text-white
          
          shadow-md
        "
      >
        <Star
          className="
            w-5
            h-5
            
            fill-white
          "
        />
      </div>

      {/* INFO */}
      <div
        className="
          flex
          flex-col
        "
      >
        
        {/* TOP */}
        <div
          className="
            flex
            items-center
            gap-3
            
            flex-wrap
          "
        >
          
          {/* RATING */}
          <span
            className="
              text-xl
              md:text-2xl
              
              font-extrabold
              
              text-slate-900
            "
          >
            {rating}
          </span>

          {/* REVIEWS */}
          <span
            className="
              text-slate-500
              
              font-medium
              
              text-sm
              md:text-base
            "
          >
            ({reviews} reviews)
          </span>
        </div>

        {/* SUBTEXT */}
        <div
          className="
            mt-1
            
            flex
            items-center
            gap-2
          "
        >
          <TrendingUp
            size={14}
            className="
              text-emerald-500
            "
          />

          <span
            className="
              text-sm
              
              font-medium
              
              text-emerald-600
            "
          >
            Highly Recommended
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityRating;