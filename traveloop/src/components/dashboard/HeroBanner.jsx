// src/components/dashboard/HeroBanner.jsx

import React from "react";
import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// IMAGE
import HeroImage from "../../assets/images/hero-banner.jpg";

const HeroBanner = () => {
  const navigate = useNavigate();

  return (
    <div
      className="
        relative
        w-full
        h-[220px]
        rounded-mobile-3xl
        overflow-hidden
        shadow-card
      "
    >
      {/* BACKGROUND IMAGE */}
      <img
        src={HeroImage}
        alt="Travel Banner"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* GRADIENT OVERLAY */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-black/75
          via-black/40
          to-black/10
        "
      />

      {/* CYAN GLOW */}
      <div
        className="
          absolute
          top-0
          right-0
          w-32
          h-32
          bg-cyan-400/20
          rounded-full
          blur-2xl
        "
      />

      {/* FLOATING BADGE */}
      <div
        className="
          absolute
          top-4
          right-4
          flex
          items-center
          gap-1.5
          px-3
          py-1.5
          rounded-full
          bg-white/15
          backdrop-blur-md
          border
          border-white/20
          text-white
          text-xs
          font-medium
          animate-float
        "
      >
        🎈 <span>120+ Destinations</span>
      </div>

      {/* CONTENT */}
      <div
        className="
          absolute
          bottom-0
          left-0
          right-0
          p-5
        "
      >
        {/* LOCATION PILL */}
        <div className="flex items-center gap-1.5 text-slate-200 text-xs mb-2">
          <MapPin size={12} />
          <span>Discover Beautiful Places</span>
        </div>

        {/* TITLE */}
        <h2
          className="
            text-2xl
            font-extrabold
            text-white
            leading-tight
            mb-3
          "
        >
          Explore The World
          <br />
          Your Way ✈️
        </h2>

        {/* CTA */}
        <button
          onClick={() => navigate("/create-trip")}
          className="
            flex
            items-center
            gap-2
            px-4
            py-2.5
            rounded-mobile-lg
            bg-gradient-to-r
            from-teal-500
            to-cyan-500
            text-white
            text-sm
            font-semibold
            shadow-brand
            active:scale-95
            transition-transform
            duration-150
          "
        >
          <span>Start Planning</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default HeroBanner;