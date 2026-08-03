// src/pages/MyTrips.jsx — Manually Created Personal Trips ONLY

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import {
  Map, CalendarDays, MapPin, Clock, Plus, ListChecks,
  StickyNote, Package, ChevronRight, DollarSign, Edit3, Trash2
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/mobile/MobileToast";
import { subscribeUnreadCount } from "../services/chatService";
import { socket } from "../utils/socket";

const COVERS = [
  "linear-gradient(135deg,#667EEA,#764BA2)",
  "linear-gradient(135deg,#F093FB,#F5576C)",
  "linear-gradient(135deg,#4FACFE,#00F2FE)",
  "linear-gradient(135deg,#43E97B,#38F9D7)",
  "linear-gradient(135deg,#FA709A,#FEE140)",
  "linear-gradient(135deg,#14B8B5,#0D9488)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
];

const DEST_EMOJIS = {
  Goa: "🏖️", Bali: "🌴", Paris: "🗼", Tokyo: "🌸",
  Maldives: "🐚", Switzerland: "🏔️", Dubai: "🌆",
  Kerala: "🌿", Manali: "❄️", Rajasthan: "🏰", default: "✈️",
};
const getEmoji = (dest) => {
  const destStr = typeof dest === "string" ? dest : "";
  for (const key of Object.keys(DEST_EMOJIS)) {
    if (key !== "default" && destStr.toLowerCase().includes(key.toLowerCase()))
      return DEST_EMOJIS[key];
  }
  return DEST_EMOJIS.default;
};

const STATUS_CONFIG = {
  upcoming:  { label: "Upcoming",  bg: "bg-blue-500",    text: "text-white" },
  ongoing:   { label: "Ongoing",   bg: "bg-emerald-500", text: "text-white" },
  completed: { label: "Completed", bg: "bg-slate-400",   text: "text-white" },
  planning:  { label: "Planning",  bg: "bg-amber-500",   text: "text-white" },
};

const TABS = [
  { key: "all",       label: "All Trips" },
  { key: "upcoming",  label: "⏰ Upcoming" },
  { key: "ongoing",   label: "🚀 Ongoing" },
  { key: "completed", label: "✅ Completed" },
  { key: "planning",  label: "📝 Planning" },
];

const PersonalTripCard = ({ trip, index, onClick, onStatusClick, onDeleteClick, unreadCount }) => {
  if (!trip) return null;
  const navigate = useNavigate();
  const status   = STATUS_CONFIG[trip.status] || STATUS_CONFIG.planning;
  const cover    = COVERS[index % COVERS.length];
  const emoji    = getEmoji(trip.destination);
  const [imageError, setImageError] = useState(false);

  const days = trip.startDate && trip.endDate
    ? Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000))
    : null;

  const daysLeft = trip.startDate
    ? Math.max(0, Math.ceil((new Date(trip.startDate) - new Date()) / 86400000))
    : null;

  const ACTIONS = [
    { icon: ListChecks, label: "Itinerary",  path: `/build-itinerary/${trip._id}`,   color: "text-teal-600 dark:text-teal-400",   bg: "bg-teal-50 dark:bg-teal-950/40" },
    { icon: Package,    label: "Packing",    path: `/packing-checklist/${trip._id}`, color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/40" },
    { icon: DollarSign, label: "Budget",     path: `/trip-budget/${trip._id}`,       color: "text-rose-600 dark:text-rose-400",   bg: "bg-rose-50 dark:bg-rose-950/40" },
    { icon: StickyNote, label: "Notes",      path: `/trip-notes/${trip._id}`,        color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/70 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
    >
      <div className="relative h-44 sm:h-48 overflow-hidden bg-slate-800">
        {trip.coverImage && !imageError ? (
          <img
            src={trip.coverImage}
            alt={trip.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative" style={{ background: cover }}>
            <span className="text-6xl filter drop-shadow-md select-none group-hover:scale-110 transition-transform duration-300">
              {emoji}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          {trip.role === "editor" || trip.role === "Editor" ? (
            <div className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-cyan-600 text-white backdrop-blur-md shadow-sm flex items-center gap-1">
              ✏️ Editor
            </div>
          ) : trip.role === "viewer" || trip.role === "Viewer" ? (
            <div className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-purple-600 text-white backdrop-blur-md shadow-sm flex items-center gap-1">
              👁️ Viewer
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white backdrop-blur-md shadow-sm flex items-center gap-1">
              👑 Owner
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/edit-trip/${trip._id}`); }}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all active:scale-95"
            title="Edit Trip"
          >
            <Edit3 size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteClick(trip._id); }}
            className="p-1.5 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white backdrop-blur-md transition-all active:scale-95"
            title="Delete Trip"
          >
            <Trash2 size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onStatusClick(trip._id, trip.status || "planning"); }}
            className={`px-3 py-1 rounded-full text-[11px] font-bold ${status.bg} ${status.text} shadow-xs active:scale-95 transition-all`}
          >
            {status.label}
          </button>
        </div>

        {daysLeft !== null && daysLeft > 0 && (
          <div className="absolute top-[52px] left-4 z-30 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{daysLeft}d to go</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5 z-30">
          <h3 className="text-white font-extrabold text-lg lg:text-xl leading-tight truncate">
            {trip.title}
          </h3>
          <div className="flex items-center justify-between gap-1.5 mt-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin size={12} className="text-white/70 flex-shrink-0" />
              <span className="text-white/70 text-xs lg:text-sm truncate max-w-[160px]">{trip.destination}</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                💬 {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-5 py-3 lg:py-4 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
          {trip.startDate && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs lg:text-sm">
              <CalendarDays size={13} className="text-teal-500" />
              <span>{new Date(trip.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
            </div>
          )}
          {days && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs lg:text-sm">
              <Clock size={13} className="text-violet-500" />
              <span>{days} days</span>
            </div>
          )}
          {trip.budget && (
            <div className="flex items-center gap-1.5 text-xs lg:text-sm font-semibold text-amber-600 dark:text-amber-400">
              <DollarSign size={13} />
              <span>₹{trip.budget.toLocaleString()}</span>
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
      </div>

      <div className="px-3 lg:px-5 py-3 flex gap-2">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.90 }}
              onClick={e => { e.stopPropagation(); navigate(action.path); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl ${action.bg} ${action.color} transition-all`}
            >
              <Icon size={16} />
              <span className="text-[10px] font-semibold">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

const MyTrips = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isInitialized, firebaseUser } = useAuth();

  const [personalTrips, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTripForStatus, setSelectedTripForStatus] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    if (!user || personalTrips.length === 0 || !isInitialized || !firebaseUser) return;
    const unsubscribes = personalTrips
      .filter(t => t && t._id)
      .map(t =>
        subscribeUnreadCount(t._id, user.id || user._id, (count) => {
          setUnreadCounts(prev => ({ ...prev, [t._id]: count }));
        })
      );
    return () => unsubscribes.forEach(u => typeof u === "function" && u());
  }, [personalTrips, user, isInitialized, firebaseUser]);

  const handleUpdateStatus = async (tripId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(t => (t._id === tripId ? { ...t, status: newStatus } : t)));
        setSelectedTripForStatus(null);
        toast.success("Status updated!");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this personal trip?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.filter(t => t._id !== tripId));
        toast.success("Trip deleted successfully!");
      } else {
        toast.error(data.message || "Failed to delete trip.");
      }
    } catch (err) {
      toast.error("Error deleting trip.");
    }
  };

  const fetchUserTrips = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(getApiUrl("trips/my"), { headers });
      let data = await res.json();
      if (!data.success) {
        const fallback = await fetch(getApiUrl("trips"), { headers });
        data = await fallback.json();
      }

      const trips = data?.trips || data?.data || [];
      const userOnly = (trips || []).filter(t => t && (!t.tripType || t.tripType === "manual"));
      setItems(userOnly);
    } catch (err) {
      console.error("[MyTrips] Error fetching trips:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserTrips();
    window.addEventListener("refreshTrips", fetchUserTrips);
    return () => window.removeEventListener("refreshTrips", fetchUserTrips);
  }, [fetchUserTrips]);

  const isTripToday = (startDateStr) => {
    if (!startDateStr) return false;
    const travelDate = new Date(`${startDateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return travelDate.getTime() === today.getTime();
  };

  const isTripUpcoming = (startDateStr) => {
    if (!startDateStr) return false;
    const travelDate = new Date(`${startDateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return travelDate.getTime() > today.getTime();
  };

  const filteredTrips = personalTrips.filter(t => {
    if (!t) return false;
    const matchSearch =
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.destination || "").toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "today") return isTripToday(t.startDate);
    if (activeTab === "upcoming") return isTripUpcoming(t.startDate);
    if (activeTab === "ongoing") return t.status === "ongoing" || isTripToday(t.startDate);
    if (activeTab === "completed") return (t.status || "").includes("completed");
    if (activeTab === "planning") return (t.status || "planning").includes("planning");
    return true;
  });

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-widest mb-2">
                  <Map size={16} /> Personal Itineraries & Plans
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  My Trips
                </h1>
                <p className="text-slate-300 text-sm mt-1 max-w-xl">
                  Trips planned and created by you. Organize itineraries, budgets, packing lists, and notes.
                </p>
              </div>

              <button
                onClick={() => navigate("/create-trip")}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all w-full md:w-auto"
              >
                <Plus size={18} />
                Create New Trip
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar mt-8 pt-4 border-t border-white/10">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                      : "bg-white/10 text-slate-300 hover:bg-white/15"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl p-2.5 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <Map size={18} className="text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search by trip title or destination..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Loading your trip plans...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm my-8 flex flex-col items-center justify-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
                <Map size={36} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">No Personal Trips Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  {search
                    ? `No trips match "${search}". Try clearing your search.`
                    : "You haven't created any custom trips yet. Create your first trip itinerary today!"}
                </p>
              </div>
              <button
                onClick={() => navigate("/create-trip")}
                className="mt-2 px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> Create Trip Now
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip, idx) => (
                <PersonalTripCard
                  key={trip._id || idx}
                  trip={trip}
                  index={idx}
                  onClick={() => navigate(`/build-itinerary/${trip._id}`)}
                  onStatusClick={(tId, cur) => setSelectedTripForStatus({ tripId: tId, status: cur })}
                  onDeleteClick={(tId) => handleDeleteTrip(tId)}
                  unreadCount={unreadCounts[trip._id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MyTrips;
