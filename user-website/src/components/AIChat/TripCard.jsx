// src/components/AIChat/TripCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Star, ExternalLink, ArrowRight, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEFAULT_COVER = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";

export const TripCard = ({ trip, onCloseChat }) => {
  const navigate = useNavigate();

  const tripId      = trip.trip_id || trip._id || trip.id;
  const title       = trip.title || trip.name || "Curated Group Trip";
  const destination = trip.destination || trip.destinations?.[0] || trip.location || "Popular Destination";
  const price       = trip.price ? (typeof trip.price === "number" ? `₹${trip.price.toLocaleString("en-IN")}` : trip.price) : (trip.offerPrice ? `₹${trip.offerPrice.toLocaleString("en-IN")}` : "Contact Host");
  const duration    = trip.duration || (trip.days ? `${trip.days} Days / ${trip.days - 1} Nights` : "Multi-Day");
  const rating      = trip.rating || 4.9;
  const description = trip.description || trip.shortDescription || trip.reason || "Experience incredible sight-seeing, luxury transport, guided itineraries, and curated stays.";
  const image       = trip.coverImage || trip.thumbnail || trip.image || DEFAULT_COVER;

  const handleViewTrip = (e) => {
    e.stopPropagation();
    if (onCloseChat) onCloseChat();
    if (tripId) {
      navigate(`/trips/${tripId}`);
    } else {
      navigate(`/explore?search=${encodeURIComponent(destination)}`);
    }
  };

  const handleBookNow = (e) => {
    e.stopPropagation();
    if (onCloseChat) onCloseChat();
    if (tripId) {
      navigate(`/trips/${tripId}?book=true`);
    } else {
      navigate(`/explore?search=${encodeURIComponent(destination)}`);
    }
  };

  const handleOpenExplore = (e) => {
    e.stopPropagation();
    if (onCloseChat) onCloseChat();
    navigate(`/explore?search=${encodeURIComponent(destination)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md hover:shadow-lg overflow-hidden flex flex-col my-2"
    >
      {/* Top Banner Image */}
      <div className="relative h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = DEFAULT_COVER; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Rating Badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-sm text-white text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
          <Star size={10} className="text-yellow-400 fill-yellow-400" />
          <span>{rating}</span>
        </div>

        {/* Price Badge */}
        <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-xs">
          {price}
        </div>

        {/* Bottom Destination Title on Image */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
          <span className="text-xs font-black truncate drop-shadow-md">{destination}</span>
          <span className="text-[10px] font-bold text-teal-300 flex items-center gap-1 shrink-0 drop-shadow-md">
            <Clock size={10} />
            {duration}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-1">
            {title}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={handleBookNow}
            className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-xs transition-colors"
          >
            <span>Book Now</span>
            <ArrowRight size={11} />
          </button>

          <button
            onClick={handleViewTrip}
            className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
          >
            <ExternalLink size={11} />
            <span>View Trip</span>
          </button>

          <button
            onClick={handleOpenExplore}
            className="py-1.5 px-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shrink-0"
            title="Open Explore search for this destination"
          >
            <Compass size={11} />
            <span>Explore</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TripCard;
