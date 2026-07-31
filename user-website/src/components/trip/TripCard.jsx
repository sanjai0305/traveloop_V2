// src/components/trips/TripCard.jsx

import React from "react";

import {
  MapPin,
  Calendar,
} from "lucide-react";

import TripViewButton from "./TripViewButton";

const TripCard = ({
  title = "Trip Title",
  location = "Location",
  image,
  date = "Date",
}) => {
  return (
    <div
      className="
        group
        
        relative
        
        overflow-hidden
        
        rounded-[30px]
        
        bg-white
        
        border
        border-slate-200
        
        shadow-sm
        
        hover:shadow-xl
        
        transition-all
        duration-500
        
        hover:-translate-y-2
      "
    >
      
      {/* IMAGE */}
      <div
        className="
          relative
          
          h-[220px]
          
          overflow-hidden
        "
      >
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
            from-black/70
            via-black/20
            to-transparent
          "
        />

        {/* LOCATION */}
        <div
          className="
            absolute
            bottom-4
            left-4
            
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
          <MapPin size={16} />
          <span>{location}</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        
        {/* TITLE */}
        <h2
          className="
            text-xl
            md:text-2xl
            
            font-bold
            
            text-slate-800
          "
        >
          {title}
        </h2>

        {/* DATE */}
        <div
          className="
            mt-4
            
            flex
            items-center
            gap-2
            
            text-slate-500
          "
        >
          <Calendar size={18} />

          <span className="text-sm">
            {date}
          </span>
        </div>

        {/* BUTTON */}
        <div className="mt-6">
          <TripViewButton />
        </div>
      </div>
    </div>
  );
};

export default TripCard;