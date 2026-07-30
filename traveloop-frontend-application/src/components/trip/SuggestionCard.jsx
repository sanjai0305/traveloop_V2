// src/components/trip/SuggestionCard.jsx

import React, { useState } from "react";

import {
  Heart,
  MapPin,
  Star,
  ArrowRight,
} from "lucide-react";

const SuggestionCard = ({
  image,
  title,
  category,
  rating,
  location,
}) => {
  
  // FAVORITE STATE
  const [liked, setLiked] = useState(false);

  return (
    <div
      className="
        group
        relative
        
        overflow-hidden
        
        rounded-[32px]
        
        bg-white
        
        border
        border-slate-200
        
        shadow-sm
        
        hover:shadow-2xl
        
        transition-all
        duration-500
        
        hover:-translate-y-2
      "
    >
      
      {/* IMAGE SECTION */}
      <div
        className="
          relative
          
          h-[260px]
          
          overflow-hidden
        "
      >
        
        {/* IMAGE */}
        <img
          src={image}
          alt={title}
          className="
            w-full
            h-full
            
            object-cover
            
            transition-transform
            duration-700
            
            group-hover:scale-110
          "
        />

        {/* OVERLAY */}
        <div
          className="
            absolute
            inset-0
            
            bg-gradient-to-t
            from-black/75
            via-black/10
            to-transparent
          "
        />

        {/* CATEGORY */}
        <div
          className="
            absolute
            top-5
            left-5
            
            px-4
            py-2
            
            rounded-full
            
            bg-white/15
            backdrop-blur-xl
            
            border
            border-white/20
            
            text-white
            
            text-sm
            
            font-semibold
          "
        >
          {category}
        </div>

        {/* FAVORITE */}
        <button
          onClick={() =>
            setLiked(!liked)
          }
          className="
            absolute
            top-5
            right-5
            
            w-12
            h-12
            
            rounded-full
            
            bg-white/15
            backdrop-blur-xl
            
            border
            border-white/20
            
            flex
            items-center
            justify-center
            
            transition-all
            duration-300
            
            hover:scale-110
          "
        >
          <Heart
            size={22}
            className={`
              transition-all
              duration-300
              
              ${
                liked
                  ? "fill-red-500 text-red-500"
                  : "text-white"
              }
            `}
          />
        </button>

        {/* RATING */}
        <div
          className="
            absolute
            bottom-5
            left-5
            
            flex
            items-center
            gap-2
            
            px-4
            py-2
            
            rounded-full
            
            bg-white/15
            backdrop-blur-xl
            
            border
            border-white/20
            
            text-white
            
            text-sm
            
            font-semibold
          "
        >
          <Star
            size={16}
            className="
              fill-yellow-400
              text-yellow-400
            "
          />

          <span>{rating}</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        
        {/* LOCATION */}
        <div
          className="
            flex
            items-center
            gap-2
            
            text-slate-500
            
            text-sm
            
            mb-3
          "
        >
          <MapPin size={16} />

          <span>{location}</span>
        </div>

        {/* TITLE */}
        <h2
          className="
            text-2xl
            
            font-bold
            
            text-slate-800
            
            leading-tight
          "
        >
          {title}
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-4
            
            text-slate-500
            
            text-sm
            
            leading-7
          "
        >
          Discover unforgettable experiences,
          beautiful scenery, and premium
          attractions during your journey.
        </p>

        {/* FOOTER */}
        <div
          className="
            mt-6
            
            flex
            items-center
            justify-between
          "
        >
          
          {/* STATUS */}
          <div>
            <p
              className="
                text-xs
                
                text-slate-400
              "
            >
              Availability
            </p>

            <h4
              className="
                mt-1
                
                text-base
                
                font-bold
                
                text-emerald-500
              "
            >
              Available
            </h4>
          </div>

          {/* BUTTON */}
          <button
            className="
              group/button
              
              flex
              items-center
              gap-2
              
              px-5
              py-3
              
              rounded-2xl
              
              bg-gradient-to-r
              from-teal-500
              to-cyan-500
              
              text-white
              
              text-sm
              
              font-semibold
              
              shadow-lg
              
              hover:scale-105
              
              transition-all
              duration-300
            "
          >
            <span>Explore</span>

            <ArrowRight
              size={18}
              className="
                transition-transform
                duration-300
                
                group-hover/button:translate-x-1
              "
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionCard;