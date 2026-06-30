// src/components/dashboard/DestinationCard.jsx

import React, { useState } from "react";
import { Heart, MapPin, Star, ArrowRight } from "lucide-react";

const DestinationCard = ({
  image,
  title,
  country,
  rating = "4.8",
  places = "120+ Places",
  onClick,
}) => {
  const [liked, setLiked] = useState(false);

  return (
    <div
      className="
        group
        relative
        mobile-card
        touch-feedback
        overflow-visible
      "
      onClick={onClick}
    >
      {/* IMAGE */}
      <div className="relative h-44 rounded-mobile-xl overflow-hidden">
        <img
          src={image}
          alt={title}
          className="
            w-full
            h-full
            object-cover
            transition-transform
            duration-500
            group-active:scale-105
          "
        />

        {/* GRADIENT OVERLAY */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/70
            via-black/20
            to-transparent
            rounded-mobile-xl
          "
        />

        {/* RATING BADGE */}
        <div
          className="
            absolute
            top-3
            left-3
            flex
            items-center
            gap-1.5
            px-2.5
            py-1.5
            rounded-full
            bg-black/30
            backdrop-blur-md
            border
            border-white/20
            text-white
            text-xs
            font-semibold
          "
        >
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span>{rating}</span>
        </div>

        {/* FAVOURITE BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
          className="
            absolute
            top-3
            right-3
            w-9
            h-9
            rounded-full
            bg-black/30
            backdrop-blur-md
            border
            border-white/20
            flex
            items-center
            justify-center
            active:scale-90
            transition-transform
            duration-150
          "
        >
          <Heart
            size={16}
            className={liked ? "fill-red-500 text-red-500" : "text-white"}
          />
        </button>

        {/* LOCATION — bottom overlay */}
        <div
          className="
            absolute
            bottom-3
            left-3
            right-3
            flex
            items-center
            justify-between
          "
        >
          <div>
            <div className="flex items-center gap-1 text-slate-300 text-xs mb-1">
              <MapPin size={12} />
              <span>{country}</span>
            </div>
            <h3 className="text-white text-base font-bold leading-tight">{title}</h3>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="
              flex
              items-center
              justify-center
              w-9
              h-9
              rounded-full
              bg-teal-500
              text-white
              shadow-brand
              active:scale-90
              transition-transform
              duration-150
            "
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* INFO ROW */}
      <div
        className="
          flex
          items-center
          justify-between
          px-1
          pt-3
          pb-1
        "
      >
        <span className="text-slate-500 text-xs">{places}</span>
        <span className="text-teal-600 text-xs font-semibold">Explore →</span>
      </div>
    </div>
  );
};

export default DestinationCard;