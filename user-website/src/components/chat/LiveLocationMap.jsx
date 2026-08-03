import React, { useState, useEffect } from "react";
import { Navigation, Clock, ShieldAlert, Square, ExternalLink, RefreshCw } from "lucide-react";

const LiveLocationMap = ({ location, isOwner, onStopSharing }) => {
  const [currentPos, setCurrentPos] = useState({
    lat: location?.lat || 48.8566,
    lng: location?.lng || 2.3522,
    speed: location?.speed || 0,
    heading: location?.heading || 0,
  });

  const [lastUpdated, setLastUpdated] = useState("Just now");

  useEffect(() => {
    if (location?.lat && location?.lng) {
      setCurrentPos({
        lat: location.lat,
        lng: location.lng,
        speed: location.speed || 0,
        heading: location.heading || 0,
      });
      setLastUpdated("Just now");
    }
  }, [location]);

  const mapsUrl = `https://www.google.com/maps?q=${currentPos.lat},${currentPos.lng}`;

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-3 max-w-sm shadow-xl font-sans">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <h4 className="text-xs font-black text-white">Live GPS Location</h4>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
          Active ({location?.duration || "15m"})
        </span>
      </div>

      {/* Mini Google Map Preview Frame */}
      <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
        <iframe
          title="Live GPS Location Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={`https://maps.google.com/maps?q=${currentPos.lat},${currentPos.lng}&z=15&output=embed`}
          className="w-full h-full filter saturate-150 contrast-125"
        />

        {/* Live Speed Badge Overlay */}
        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[10px] font-black text-cyan-400 flex items-center gap-1.5 shadow-md">
          <Navigation size={12} className="text-cyan-400 transform rotate-45" />
          <span>{currentPos.speed ? `${currentPos.speed} km/h` : "Stationary"}</span>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Open in Google Maps"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Info Stats */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-slate-500" />
          <span>Updated: {lastUpdated}</span>
        </div>
        {currentPos.distance && (
          <span className="font-extrabold text-cyan-400">{currentPos.distance} away</span>
        )}
      </div>

      {/* Stop sharing button */}
      {isOwner && onStopSharing && (
        <button
          type="button"
          onClick={onStopSharing}
          className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Square size={14} /> Stop Sharing Location
        </button>
      )}
    </div>
  );
};

export default LiveLocationMap;
