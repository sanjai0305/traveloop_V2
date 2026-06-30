// src/components/admin/AdminOverviewCards.jsx

import React from "react";

// COMPONENTS
import AdminStatCard from "./AdminStatCard";

// ICONS
import {
  Users,
  MapPinned,
  Star,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    id: 1,
    title: "Total Users",
    value: "12.4K",
    growth: "+18%",
    description:
      "Active travelers registered",
    icon: Users,
    gradient:
      "from-teal-500 to-cyan-500",
  },

  {
    id: 2,
    title: "Popular Cities",
    value: "148",
    growth: "+12%",
    description:
      "Top searched destinations",
    icon: MapPinned,
    gradient:
      "from-orange-400 to-pink-500",
  },

  {
    id: 3,
    title: "Activities Booked",
    value: "8.9K",
    growth: "+24%",
    description:
      "Adventure bookings completed",
    icon: Star,
    gradient:
      "from-cyan-500 to-sky-500",
  },

  {
    id: 4,
    title: "Revenue Growth",
    value: "₹4.2M",
    growth: "+31%",
    description:
      "Monthly platform revenue",
    icon: TrendingUp,
    gradient:
      "from-emerald-500 to-green-500",
  },
];

const AdminOverviewCards = () => {
  return (
    <div
      className="
        grid
        grid-cols-1
        md:grid-cols-2
        2xl:grid-cols-4
        
        gap-6
      "
    >
      {stats.map((stat) => (
        <AdminStatCard
          key={stat.id}
          stat={stat}
        />
      ))}
    </div>
  );
};

export default AdminOverviewCards;