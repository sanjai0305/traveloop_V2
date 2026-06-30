import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Map, Globe, Clock, Star } from "lucide-react";

const TravelScoreCard = ({ trips = [], loading = false }) => {
  const stats = useMemo(() => {
    // FIX 8: Always show 0 (never undefined/empty) when no trips
    const tripsCount = trips.length;
    const countriesCount = new Set(trips.map(t => {
      if (!t.destination) return "";
      const parts = t.destination.split(",");
      return parts[parts.length - 1].trim();
    }).filter(Boolean)).size;

    const totalDays = trips.reduce((sum, trip) => {
      if (!trip.startDate || !trip.endDate) return sum + 1;
      const diff = new Date(trip.endDate) - new Date(trip.startDate);
      return sum + Math.max(1, Math.ceil(diff / 86400000));
    }, 0);

    const explorerScore = tripsCount * 10 + countriesCount * 20 + totalDays * 1;

    return [
      { icon: Map,   label: "Trips",     value: loading ? null : String(tripsCount),     color: "#14B8B5" },
      { icon: Globe, label: "Countries", value: loading ? null : String(countriesCount),  color: "#8B5CF6" },
      { icon: Clock, label: "Days",      value: loading ? null : String(totalDays),       color: "#F59E0B" },
      { icon: Star,  label: "Score",     value: loading ? null : String(explorerScore),   color: "#EF4444" },
    ];
  }, [trips, loading]);


  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="premium-card p-4 mx-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Travel Stats</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
          ✦ Explorer
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * i + 0.3, type: "spring", stiffness: 300 }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}15` }}
              >
                <Icon size={18} style={{ color: stat.color }} />
              </div>
              {stat.value === null ? (
                <div className="h-5 w-8 skeleton rounded" />
              ) : (
                <span className="text-lg font-extrabold text-slate-800">{stat.value}</span>
              )}
              <span className="text-[10px] font-medium text-slate-400">{stat.label}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TravelScoreCard;
