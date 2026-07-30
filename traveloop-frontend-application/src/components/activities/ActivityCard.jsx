// src/components/activities/ActivityCard.jsx

import React, { useState } from "react";

import {
  MapPin,
  Clock3,
  Star,
  Heart,
  ShieldCheck,
} from "lucide-react";

// COMPONENTS
import ActivityTags from "./ActivityTags";
import ActivityPrice from "./ActivityPrice";
import ActivityButton from "./ActivityButton";

const ActivityCard = ({ activity }) => {
  
  // FAVORITE STATE
  const [liked, setLiked] =
    useState(false);

  return (
    <div
      className="
        group
        
        w-full
        
        bg-white
        
        border
        border-slate-200
        
        rounded-[32px]
        
        overflow-hidden
        
        shadow-sm
        
        hover:shadow-xl
        
        transition-all
        duration-500
        
        hover:-translate-y-1
      "
    >
      
      <div
        className="
          flex
          flex-col
          xl:flex-row
        "
      >
        
        {/* IMAGE SECTION */}
        <div
          className="
            relative
            
            xl:w-[340px]
            w-full
            
            h-[250px]
            md:h-[300px]
            xl:h-auto
            
            overflow-hidden
            
            flex-shrink-0
          "
        >
          
          {/* IMAGE */}
          <img
            src={activity.image}
            alt={activity.title}
            className="
              w-full
              h-full
              
              object-cover
              
              transition-transform
              duration-700
              
              group-hover:scale-105
            "
          />

          {/* OVERLAY */}
          <div
            className="
              absolute
              inset-0
              
              bg-gradient-to-t
              from-black/60
              via-black/10
              to-transparent
            "
          />

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
              
              shadow-lg
              
              hover:scale-110
              
              transition-all
              duration-300
            "
          >
            <Heart
              className={`
                w-5
                h-5
                
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

          {/* VERIFIED */}
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
            <ShieldCheck size={16} />

            <span>
              Verified
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="
            flex-1
            
            p-6
            md:p-8
            
            flex
            flex-col
            justify-between
          "
        >
          
          {/* TOP CONTENT */}
          <div>
            
            {/* TAGS */}
            <ActivityTags
              tags={activity.tags}
            />

            {/* TITLE */}
            <h2
              className="
                mt-5
                
                text-2xl
                md:text-3xl
                
                font-extrabold
                
                text-slate-900
                
                leading-tight
              "
            >
              {activity.title}
            </h2>

            {/* META */}
            <div
              className="
                flex
                flex-wrap
                
                items-center
                
                gap-5
                
                mt-5
              "
            >
              
              {/* LOCATION */}
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <MapPin
                  className="
                    w-5
                    h-5
                    
                    text-teal-600
                  "
                />

                <span
                  className="
                    text-slate-600
                    
                    font-medium
                    
                    text-sm
                    md:text-base
                  "
                >
                  {activity.location}
                </span>
              </div>

              {/* DURATION */}
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <Clock3
                  className="
                    w-5
                    h-5
                    
                    text-orange-500
                  "
                />

                <span
                  className="
                    text-slate-600
                    
                    font-medium
                    
                    text-sm
                    md:text-base
                  "
                >
                  {activity.duration}
                </span>
              </div>

              {/* RATING */}
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <Star
                  className="
                    w-5
                    h-5
                    
                    fill-yellow-400
                    text-yellow-400
                  "
                />

                <span
                  className="
                    font-bold
                    
                    text-slate-800
                  "
                >
                  {activity.rating}
                </span>

                <span
                  className="
                    text-slate-500
                    
                    text-sm
                  "
                >
                  ({activity.reviews})
                </span>
              </div>
            </div>

            {/* DESCRIPTION */}
            <p
              className="
                mt-6
                
                text-slate-500
                
                leading-7
                
                text-sm
                md:text-base
                
                max-w-3xl
              "
            >
              {activity.description}
            </p>
          </div>

          {/* BOTTOM */}
          <div
            className="
              mt-8
              
              flex
              flex-col
              lg:flex-row
              
              items-start
              lg:items-end
              
              justify-between
              
              gap-6
            "
          >
            
            {/* PRICE */}
            <ActivityPrice
              price={activity.price}
              oldPrice={
                activity.oldPrice
              }
            />

            {/* BUTTON */}
            <ActivityButton
              text="View Details"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;