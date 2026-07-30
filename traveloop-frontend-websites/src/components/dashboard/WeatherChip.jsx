// src/components/dashboard/WeatherChip.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cloud, Sun, CloudRain, Wind } from "lucide-react";
import { getApiUrl } from "../../utils/api";

const CONFIG_MAP = {
  "Sunny": { icon: Sun, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "Partly Cloudy": { icon: Cloud, color: "#64748B", bg: "rgba(100,116,139,0.10)" },
  "Overcast": { icon: Cloud, color: "#475569", bg: "rgba(71,85,105,0.10)" },
  "Foggy": { icon: Wind, color: "#64748B", bg: "rgba(100,116,139,0.10)" },
  "Drizzle": { icon: CloudRain, color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
  "Light Drizzle": { icon: CloudRain, color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
  "Heavy Drizzle": { icon: CloudRain, color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
  "Rainy": { icon: CloudRain, color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
  "Light Rain": { icon: CloudRain, color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
  "Heavy Rain": { icon: CloudRain, color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  "Rain Showers": { icon: CloudRain, color: "#3B82F6", bg: "rgba(59,130,246,0.10)" },
  "Violent Showers": { icon: CloudRain, color: "#1D4ED8", bg: "rgba(29,78,216,0.15)" },
  "Snowy": { icon: Cloud, color: "#06B6D4", bg: "rgba(6,182,212,0.10)" },
  "Light Snow": { icon: Cloud, color: "#06B6D4", bg: "rgba(6,182,212,0.10)" },
  "Heavy Snow": { icon: Cloud, color: "#0891B2", bg: "rgba(8,145,178,0.12)" },
  "Thunderstorm": { icon: CloudRain, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  "Severe Storm": { icon: CloudRain, color: "#7C3AED", bg: "rgba(124,58,237,0.15)" },
};

const getDefaultConfig = (label) => {
  return CONFIG_MAP[label] || { icon: Sun, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" };
};

// FIX 7: Strip airport/terminal suffixes so only the city name is shown
const cleanCityName = (rawCity = "") => {
  return rawCity
    .replace(/\b(international\s+airport|domestic\s+airport|airport|domestic\s+terminal|international\s+terminal|terminal\s+\d*)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/,\s*$/, "")
    .trim();
};

const WeatherChip = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let city = "Chennai";
        try {
          const user = JSON.parse(localStorage.getItem("user"));
          if (user?.city) city = cleanCityName(user.city);
        } catch (_) {}


        const token = localStorage.getItem("token");
        const res = await fetch(getApiUrl(`weather?city=${encodeURIComponent(city)}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setWeather(data);
        }
      } catch (err) {
        console.error("Failed to load weather:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
  }, []);

  if (loading || !weather) {
    return (
      <div className="w-16 h-6 skeleton rounded-full" />
    );
  }

  const { temp, label } = weather.current;
  const config = getDefaultConfig(label);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-2xs"
      style={{
        background: config.bg,
        borderColor: `${config.color}30`,
      }}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={14} style={{ color: config.color }} />
      </motion.div>
      <span className="text-xs font-bold" style={{ color: config.color }}>
        {temp} · {label}
      </span>
    </motion.div>
  );
};

export default WeatherChip;
