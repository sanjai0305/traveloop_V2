// src/components/myTrips/TripStatusBadge.jsx

import React from "react";

import {
  CheckCircle2,
  Clock3,
  Plane,
} from "lucide-react";

const TripStatusBadge = ({
  status = "Upcoming",
}) => {
  
  // STATUS CONFIG
  const statusConfig = {
    Ongoing: {
      icon: Plane,
      classes: `
        bg-cyan-500/20
        border-cyan-300/30
        text-cyan-100
      `,
    },

    Upcoming: {
      icon: Clock3,
      classes: `
        bg-orange-500/20
        border-orange-300/30
        text-orange-100
      `,
    },

    Completed: {
      icon: CheckCircle2,
      classes: `
        bg-emerald-500/20
        border-emerald-300/30
        text-emerald-100
      `,
    },
  };

  // CURRENT STATUS
  const current =
    statusConfig[status] ||
    statusConfig.Upcoming;

  const Icon = current.icon;

  return (
    <div
      className={`
        flex
        items-center
        gap-2
        
        px-4
        py-2
        
        rounded-full
        
        backdrop-blur-xl
        
        border
        
        text-sm
        
        font-semibold
        
        shadow-lg
        
        ${current.classes}
      `}
    >
      
      {/* ICON */}
      <Icon size={16} />

      {/* TEXT */}
      <span>
        {status}
      </span>
    </div>
  );
};

export default TripStatusBadge;