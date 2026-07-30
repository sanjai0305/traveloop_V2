// src/pages/NearbyPlaces.jsx — GPS-powered nearby places discovery

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import { getApiUrl } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/mobile/MobileToast";
import {
  MapPin, Star, Navigation, Search, Loader, ExternalLink,
  Utensils, Hotel, Heart, Landmark, DollarSign, Pill
} from "lucide-react";

const PLACE_TYPES = [
  { key: "tourist_attraction", label: "Attractions",  emoji: "🏛️", icon: Landmark  },
  { key: "restaurant",         label: "Restaurants",  emoji: "🍽️", icon: Utensils  },
  { key: "lodging",            label: "Hotels",       emoji: "🏨", icon: Hotel     },
  { key: "hospital",           label: "Hospitals",    emoji: "🏥", icon: Heart     },
  { key: "atm",                label: "ATMs",         emoji: "💵", icon: DollarSign },
  { key: "pharmacy",           label: "Pharmacies",   emoji: "💊", icon: Pill      },
];

const StarRating = ({ rating }) => {
  if (!rating) return <span className="text-[10px] text-slate-400">No rating</span>;
  return (
    <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600">
      <Star size={10} className="fill-amber-400 stroke-amber-400" />
      {rating.toFixed(1)}
    </span>
  );
};

const NearbyPlaces = () => {
  const { isDark } = useTheme();
  const toast = useToast();

  const [coords,      setCoords]      = useState(null);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [gpsError,    setGpsError]    = useState(null);
  const [activeType,  setActiveType]  = useState("tourist_attraction");
  const [places,      setPlaces]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [searched,    setSearched]    = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => {
        setGpsError("Location access denied. Please allow location access to find nearby places.");
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  const searchNearby = async (type = activeType) => {
    if (!coords) { toast.error("Location not available. Please enable GPS."); return; }
    setLoading(true);
    setSearched(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        getApiUrl(`nearby?lat=${coords.lat}&lng=${coords.lng}&type=${type}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setPlaces(data.places || []);
        setSearched(true);
      } else {
        toast.error(data.message || "Could not load nearby places.");
      }
    } catch (err) {
      console.error("Nearby places error:", err);
      toast.error("Failed to load nearby places.");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    if (coords) searchNearby(type);
  };

  const openGoogleMaps = (place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
    window.open(url, "_blank");
  };

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-mobile-nav">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-5 mb-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-[16px] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}>
              <MapPin size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800">Nearby Places</h1>
              <p className="text-xs text-slate-400">Discover what's around you</p>
            </div>
          </div>

          {/* GPS status */}
          {gpsLoading && (
            <div className="flex items-center gap-2 text-xs text-teal-600 font-bold">
              <Loader size={14} className="animate-spin" /> Getting your location...
            </div>
          )}
          {coords && !gpsLoading && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
              <MapPin size={12} className="fill-emerald-500 stroke-emerald-600" />
              Location found — {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </div>
          )}
          {gpsError && (
            <div className="space-y-2">
              <p className="text-xs text-red-500 font-semibold">{gpsError}</p>
              <button
                onClick={getLocation}
                className="px-4 py-2 rounded-full text-white font-bold text-xs active:scale-95"
                style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
              >
                Try Again
              </button>
            </div>
          )}
        </motion.div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 scrollbar-hide">
          {PLACE_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <motion.button
                key={type.key}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleTypeChange(type.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border flex-shrink-0 transition-all ${
                  activeType === type.key
                    ? "text-white border-teal-500"
                    : "bg-white border-slate-200 text-slate-600"
                }`}
                style={activeType === type.key ? { background: "linear-gradient(135deg,#14B8B5,#0D9488)" } : {}}
              >
                <span>{type.emoji}</span>{type.label}
              </motion.button>
            );
          })}
        </div>

        {/* Search button */}
        {coords && !loading && !searched && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => searchNearby()}
            className="w-full py-4 rounded-[18px] text-white font-bold text-sm mb-5 flex items-center justify-center gap-2 shadow-brand"
            style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
          >
            <Search size={16} /> Find Nearby Places
          </motion.button>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 skeleton rounded-[20px]" />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && searched && places.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-bold text-slate-600">No places found nearby</p>
            <p className="text-xs text-slate-400">Try a different category</p>
          </div>
        )}

        {!loading && places.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-xs font-bold text-slate-400">{places.length} places found nearby</p>
            {places.map((place, idx) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="premium-card p-4 flex items-start gap-3"
              >
                {/* Photo or placeholder */}
                <div className="w-16 h-16 rounded-[14px] overflow-hidden bg-slate-100 flex-shrink-0">
                  {place.photo ? (
                    <img src={place.photo} alt={place.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {PLACE_TYPES.find(t => t.key === activeType)?.emoji || "📍"}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 mb-0.5 truncate">{place.name}</p>
                  <p className="text-[11px] text-slate-400 mb-1 truncate">{place.address}</p>
                  <div className="flex items-center gap-3">
                    <StarRating rating={place.rating} />
                    {place.openNow !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${place.openNow ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {place.openNow ? "Open" : "Closed"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Directions button */}
                <button
                  onClick={() => openGoogleMaps(place)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-teal-600 active:scale-90 transition-all flex-shrink-0"
                  style={{ background: "rgba(20,184,181,0.1)" }}
                  title="Get directions"
                >
                  <Navigation size={16} />
                </button>
              </motion.div>
            ))}

            {/* Refresh */}
            <button
              onClick={() => searchNearby()}
              className="w-full py-3 rounded-[16px] border border-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 mt-2"
            >
              <Search size={13} /> Refresh results
            </button>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default NearbyPlaces;
