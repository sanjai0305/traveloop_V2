// src/components/dashboard/TripCard.jsx

import React from "react";
import { CalendarDays, Clock3, MapPin, ArrowRight } from "lucide-react";

const TripCard = ({
  image,
  title,
  country,
  date,
  duration,
  progress = 70,
}) => {
  return (
    <div
      className="
        group
        relative
        mobile-card
        touch-feedback
        flex
        gap-4
        p-4
      "
    >
      {/* IMAGE */}
      <div className="relative w-24 h-24 rounded-mobile-lg overflow-hidden flex-shrink-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Location pill */}
        <div
          className="
            absolute
            bottom-0
            left-0
            right-0
            flex
            items-center
            justify-center
            gap-1
            py-1
            bg-black/45
            backdrop-blur-sm
            text-white
            text-[9px]
            font-medium
          "
        >
          <MapPin size={8} />
          <span className="truncate">{country}</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-slate-800 truncate">{title}</h3>

        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <CalendarDays size={12} />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Clock3 size={12} />
            <span>{duration}</span>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400 font-medium">Planning</span>
            <span className="text-[10px] font-bold text-teal-600">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-teal-500
                to-cyan-500
              "
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ARROW */}
      <button
        className="
          flex
          items-center
          justify-center
          w-8
          h-8
          self-center
          flex-shrink-0
          rounded-full
          bg-slate-50
          border
          border-slate-100
          text-slate-400
          active:bg-teal-50
          active:text-teal-600
          active:border-teal-200
          transition-colors
          duration-150
        "
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default TripCard;