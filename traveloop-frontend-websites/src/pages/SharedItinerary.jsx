// src/pages/SharedItinerary.jsx — Premium Shared Public Itinerary Page

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, CalendarDays, Clock, Copy, Check, Share2, Plus,
  Utensils, Camera, Hotel, Car, Coffee, Ticket, Plane, CreditCard, Receipt
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import PageSkeletonLoader from "../components/common/PageSkeletonLoader";

const CATEGORY_ICONS = {
  "Food":      { icon: Utensils, color: "#F59E0B", bg: "#FEF3C7" },
  "Sightseeing":{ icon: Camera,  color: "#3B82F6", bg: "#DBEAFE" },
  "Stay":      { icon: Hotel,    color: "#8B5CF6", bg: "#EDE9FE" },
  "Transport": { icon: Car,      color: "#14B8B5", bg: "#CCFBF1" },
  "Coffee":    { icon: Coffee,   color: "#D97706", bg: "#FEF9C3" },
  "Activity":  { icon: Ticket,   color: "#EF4444", bg: "#FEE2E2" },
};

const COVERS = [
  "linear-gradient(135deg,#14B8B5,#0D9488)",
  "linear-gradient(135deg,#667EEA,#764BA2)",
  "linear-gradient(135deg,#F093FB,#F5576C)",
  "linear-gradient(135deg,#4FACFE,#00F2FE)",
];

const SharedItinerary = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [flights, setFlights] = useState([]);
  const [journals, setJournals] = useState([]);
  const [activeTab, setActiveTab] = useState("timeline");
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [copied, setCopied] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isLoggedIn = useMemo(() => {
    return !!localStorage.getItem("token");
  }, []);

  useEffect(() => {
    const fetchSharedTrip = async () => {
      try {
        const res = await fetch(getApiUrl(`trips/shared/${token}`));
        const data = await res.json();
        if (data.success) {
          setTrip(data.trip);
          setItinerary(data.itinerary || []);
          setFlights(data.flights || []);
          setJournals(data.journals || []);
        }
      } catch (err) {
        console.error("Error fetching shared trip:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSharedTrip();
  }, [token]);

  const days = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.max(1, Math.ceil((end - start) / 86400000));
  }, [trip]);

  const dayItems = useMemo(() => {
    return itinerary.filter(item => item.day === activeDay);
  }, [itinerary, activeDay]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloneTrip = async () => {
    if (!isLoggedIn) {
      alert("Please login first to save this trip to your account!");
      navigate("/");
      return;
    }

    try {
      setCloning(true);
      const authToken = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${trip._id}/clone`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setCloneSuccess(true);
        setTimeout(() => {
          navigate("/my-trips");
        }, 1500);
      }
    } catch (err) {
      alert("Failed to copy trip. Please try again.");
    } finally {
      setCloning(false);
    }
  };

  if (loading) {
    return <PageSkeletonLoader />;
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center">
        <span className="text-6xl mb-4">🗺️</span>
        <h2 className="text-xl font-extrabold text-slate-800">Itinerary Not Found</h2>
        <p className="text-slate-400 text-sm mt-1 max-w-xs">
          This shared link may be incorrect, or the owner has disabled public access.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-3 rounded-full text-white font-bold text-sm shadow-brand"
          style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
        >
          Go to Traveloop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Hero Cover */}
      <div
        className="relative h-56 w-full overflow-hidden"
        style={{ background: COVERS[1] }}
      >
        {/* Fallback layer in background */}
        <div className="absolute inset-0 flex items-center justify-center text-8xl">✈️</div>

        {/* Custom Image layer on top */}
        {trip.image && !imageError && (
          <img
            src={trip.image}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={() => setImageError(true)}
          />
        )}
        <div
          className="absolute inset-0 z-20"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent 70%)" }}
        />
        
        {/* Header Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
          <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 text-white text-[11px] font-bold">
            Public View 🔗
          </div>
          <button
            onClick={handleCopyLink}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} className="text-slate-600" />}
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 z-30">
          <h2 className="text-white font-extrabold text-2xl leading-tight">{trip.title}</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-white/80" />
              <span className="text-white/80 text-xs font-semibold">{trip.destination}</span>
            </div>
            {trip.startDate && (
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-white/80" />
                <span className="text-white/80 text-xs font-semibold">
                  {new Date(trip.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-white/80" />
              <span className="text-white/80 text-xs font-semibold">{days} days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[460px] mx-auto px-4 mt-4">
        {/* Top Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-4 mt-2">
          {[
            { id: "timeline", label: "Timeline" },
            { id: "flights", label: `Flights (${flights.length})` },
            { id: "journals", label: `Journals (${journals.length})` },
            { id: "budget", label: "Budget" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-teal-500 text-teal-600 font-extrabold"
                  : "border-transparent text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "timeline" && (
          <>
            {/* Day Tabs */}
            <div className="flex gap-2 overflow-x-auto py-3 hide-scrollbar -mx-4 px-4">
              {Array.from({ length: days }, (_, i) => i + 1).map(d => (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                    activeDay === d
                      ? "text-white shadow-brand"
                      : "bg-white text-slate-500 border border-slate-200"
                  }`}
                  style={activeDay === d ? { background: "linear-gradient(135deg,#14B8B5,#0D9488)" } : {}}
                >
                  Day {d}
                  {itinerary.filter(i => i.day === d).length > 0 && (
                    <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeDay === d ? "bg-white/25 text-white" : "bg-teal-50 text-teal-600"
                    }`}>
                      {itinerary.filter(i => i.day === d).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Timeline Activities */}
            {dayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <span className="text-4xl">📍</span>
                <p className="text-sm font-bold text-slate-500">No activities scheduled for Day {activeDay}</p>
              </div>
            ) : (
              <div className="relative mt-4">
                {/* Vertical timeline line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />

                <div className="space-y-4">
                  {dayItems.map((item, idx) => {
                    const cfg = CATEGORY_ICONS[item.category] || CATEGORY_ICONS["Activity"];
                    const CatIcon = cfg.icon;
                    return (
                      <div key={item._id || idx} className="flex gap-3 relative">
                        {/* Circle Pin Icon */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm border border-white"
                          style={{ backgroundColor: cfg.bg }}
                        >
                          <CatIcon size={16} style={{ color: cfg.color }} />
                        </div>

                        {/* Activity Card */}
                        <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}
                            >
                              {item.category}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {item.time}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                          {item.place && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" /> {item.place}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-xs text-slate-400 mt-2 bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-100">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Flights View */}
        {activeTab === "flights" && (
          <div className="space-y-3 mt-4">
            {flights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <span className="text-4xl">✈️</span>
                <p className="text-sm font-bold text-slate-500">No flights logged for this trip</p>
              </div>
            ) : (
              flights.map((f, idx) => (
                <div key={f._id || idx} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <Plane size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{f.flightNumber}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{f.airline}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      f.status === "cancelled" ? "bg-red-50 text-red-500" :
                      f.status === "delayed" ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
                    }`}>
                      {f.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Departure</p>
                      <p className="text-sm font-bold text-slate-800">{f.departureAirport || "N/A"}</p>
                      {f.departureTime && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(f.departureTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}{" "}
                          {new Date(f.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Arrival</p>
                      <p className="text-sm font-bold text-slate-800">{f.arrivalAirport || "N/A"}</p>
                      {f.arrivalTime && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(f.arrivalTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}{" "}
                          {new Date(f.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                  {(f.terminal || f.gate) && (
                    <div className="flex gap-4 border-t border-slate-50 pt-2 text-[11px] font-semibold text-slate-500">
                      {f.terminal && <span>Terminal: <span className="text-slate-800">{f.terminal}</span></span>}
                      {f.gate && <span>Gate: <span className="text-slate-800">{f.gate}</span></span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Journals View */}
        {activeTab === "journals" && (
          <div className="space-y-4 mt-4">
            {journals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <span className="text-4xl">📸</span>
                <p className="text-sm font-bold text-slate-500">No public journals shared</p>
              </div>
            ) : (
              journals.map((j, idx) => (
                <div key={j._id || idx} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{j.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Day {j.day} • {j.date}</p>
                    </div>
                    <span className="text-xl">{j.mood === "amazing" ? "🤩" : j.mood === "great" ? "😀" : j.mood === "okay" ? "😐" : j.mood === "tired" ? "😴" : "😢"}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{j.content}</p>
                  {j.photos && j.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {j.photos.map((p, pIdx) => (
                        <div key={pIdx} className="relative rounded-xl overflow-hidden aspect-video border border-slate-50">
                          <img src={p.url} alt={p.caption || "Journal Photo"} className="w-full h-full object-cover" />
                          {p.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/55 p-1 text-[9px] text-white text-center truncate">
                              {p.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Budget View */}
        {activeTab === "budget" && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Budget</p>
                <p className="text-lg font-extrabold text-slate-800 mt-1">₹{(trip.budget || 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Spent</p>
                <p className="text-lg font-extrabold text-slate-800 mt-1">
                  ₹{((trip.expenseItems || []).reduce((acc, item) => acc + (item.convertedAmount || 0), 0)).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Expenses Breakdown</h4>
              <div className="space-y-3">
                {[
                  { key: "transport", name: "Transport", color: "#14B8B5" },
                  { key: "accommodation", name: "Accommodation", color: "#8B5CF6" },
                  { key: "food", name: "Food", color: "#F59E0B" },
                  { key: "activities", name: "Activities", color: "#EF4444" },
                  { key: "shopping", name: "Shopping", color: "#EC4899" }
                ].map(cat => {
                  const spent = trip.expenses?.[cat.key] || 0;
                  const totalBudget = trip.budget || 1;
                  const pct = Math.min(100, Math.round((spent / totalBudget) * 100));
                  return (
                    <div key={cat.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>{cat.name}</span>
                        <span>₹{spent.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-50 overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ backgroundColor: cat.color, width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Clone/Copy Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex justify-center z-40">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleCloneTrip}
          disabled={cloning || cloneSuccess}
          className="w-full max-w-[420px] py-4 rounded-full text-white font-bold text-sm shadow-brand flex items-center justify-center gap-2 disabled:opacity-85"
          style={{ background: "linear-gradient(135deg, #14B8B5, #0D9488)" }}
        >
          {cloneSuccess ? (
            <>
              <Check size={18} />
              Saved to My Trips!
            </>
          ) : cloning ? (
            "Copying Trip..."
          ) : (
            <>
              <Plus size={18} />
              Save this Trip to My Account
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default SharedItinerary;
