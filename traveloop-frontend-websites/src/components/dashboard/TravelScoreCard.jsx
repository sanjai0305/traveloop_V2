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
      className="premium-card p-4 mx-4 mb-4 lg:p-0 lg:mx-0 lg:mb-6 lg:bg-transparent lg:border-none lg:shadow-none"
    >
      <div className="flex items-center gap-3 mb-4 px-4 lg:px-0">
        <span className="text-xs lg:text-base font-bold text-slate-400 lg:text-slate-300 uppercase tracking-widest">Travel Stats</span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50/10 text-teal-400 border border-teal-500/20 backdrop-blur-sm hover:bg-teal-50/20 transition-all cursor-pointer">
          ✦ Explorer
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 lg:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * i + 0.3, type: "spring", stiffness: 300 }}
              className="flex flex-col items-center gap-2 lg:gap-3 p-3 lg:p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 lg:bg-slate-900/40 lg:backdrop-blur-md lg:border lg:border-white/10 min-h-[120px] lg:h-[160px] justify-center hover:bg-slate-100/50 dark:hover:bg-slate-800/50 lg:hover:bg-slate-900/60 lg:hover:-translate-y-1.5 lg:hover:border-teal-500/30 lg:hover:shadow-[0_8px_32px_rgba(20,184,181,0.15)] transition-all duration-300 cursor-pointer"
            >
              <div
                className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all"
                style={{ background: `${stat.color}15` }}
              >
                <Icon size={18} className="lg:w-8 lg:h-8" style={{ color: stat.color }} />
              </div>
              {stat.value === null ? (
                <div className="h-5 lg:h-8 w-8 lg:w-16 skeleton rounded" />
              ) : (
                <span className="text-lg lg:text-3xl font-extrabold text-slate-800 lg:text-white">{stat.value}</span>
              )}
              <span className="text-[10px] lg:text-sm font-medium text-slate-400 lg:text-slate-300">{stat.label}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TravelScoreCard;
