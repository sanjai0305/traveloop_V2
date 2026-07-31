// src/components/itineraryView/ActivityIcon.jsx

import React from "react";

import {
  Plane,
  Hotel,
  Utensils,
  Mountain,
  ShoppingBag,
  Car,
  MapPinned,
} from "lucide-react";

const ActivityIcon = ({
  type = "Activity",
}) => {
  
  // CONFIG
  const config = {
    Transport: {
      icon: Plane,
      classes: `
        from-teal-500
        to-cyan-500
      `,
    },

    Hotel: {
      icon: Hotel,
      classes: `
        from-purple-500
        to-indigo-500
      `,
    },

    Food: {
      icon: Utensils,
      classes: `
        from-orange-400
        to-pink-500
      `,
    },

    Adventure: {
      icon: Mountain,
      classes: `
        from-emerald-500
        to-green-500
      `,
    },

    Shopping: {
      icon: ShoppingBag,
      classes: `
        from-yellow-400
        to-orange-500
      `,
    },

    Taxi: {
      icon: Car,
      classes: `
        from-cyan-500
        to-sky-500
      `,
    },

    Activity: {
      icon: MapPinned,
      classes: `
        from-slate-500
        to-slate-700
      `,
    },
  };

  // CURRENT TYPE
  const current =
    config[type] ||
    config.Activity;

  const Icon =
    current.icon;

  return (
    <div
      className={`
        flex
        items-center
        gap-3
        
        px-5
        py-3
        
        rounded-full
        
        bg-gradient-to-r
        ${current.classes}
        
        text-white
        
        shadow-lg
      `}
    >
      
      {/* ICON */}
      <div
        className="
          w-10
          h-10
          
          rounded-full
          
          bg-white/15
          
          flex
          items-center
          justify-center
        "
      >
        <Icon size={20} />
      </div>

      {/* TEXT */}
      <span
        className="
          font-semibold
          
          text-sm
          md:text-base
        "
      >
        {type}
      </span>
    </div>
  );
};

export default ActivityIcon;