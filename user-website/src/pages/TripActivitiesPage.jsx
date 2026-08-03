// src/pages/TripActivitiesPage.jsx — Dedicated Trip Activities Page
// Route: /trips/:tripId/activities

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import TripHeaderNav from "../components/trip/TripHeaderNav";
import {
  Plus, Compass, Calendar, Clock, DollarSign, MapPin, Star,
  Edit3, Trash2, Copy, MoveRight, ExternalLink, Download,
  Filter, Search, AlertTriangle, CheckCircle, Sparkles, Loader2,
  FileText, ArrowLeft, RefreshCw
} from "lucide-react";
import { getApiUrl } from "../utils/api";
import { db } from "../services/firebase";
import {
  collection, doc, setDoc, deleteDoc, updateDoc,
  query, onSnapshot, serverTimestamp
} from "firebase/firestore";

const CATEGORIES = ["All", "Sightseeing", "Adventure", "Food & Dining", "Culture", "Relaxation", "Shopping", "Transport", "Other"];

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #14B8B5, #0D9488)",
  "linear-gradient(135deg, #6366F1, #4F46E5)",
  "linear-gradient(135deg, #EC4899, #D946EF)",
  "linear-gradient(135deg, #F59E0B, #D97706)",
  "linear-gradient(135deg, #10B981, #059669)",
  "linear-gradient(135deg, #3B82F6, #1D4ED8)",
];

const TripActivitiesPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip]               = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedDay, setSelectedDay] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch]           = useState("");
  const [deletingId, setDeletingId]   = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // ── Calculate days count ──────────────────────────────────────────────────
  const daysCount = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 7;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.max(1, Math.ceil((end - start) / 86400000));
  }, [trip]);

  // ── Fetch Trip + Initial Activities ─────────────────────────────────────────
  useEffect(() => {
    let unsub = null;
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [tripRes, actRes] = await Promise.all([
          fetch(getApiUrl(`trips/${tripId}`), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(getApiUrl(`trips/${tripId}/activities`), { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const tripData = await tripRes.json();
        const actData  = await actRes.json();

        if (tripData.success) setTrip(tripData.trip);
        const apiList = actData.success && actData.activities ? actData.activities : [];

        // Realtime Firestore subscription for trip activities / itinerary items
        const colRef = collection(db, "trips", tripId, "itinerary");
        unsub = onSnapshot(colRef, (snapshot) => {
          if (snapshot.empty && apiList.length > 0) {
            setActivities(apiList);
          } else {
            const list = [];
            snapshot.forEach(docSnap => {
              const d = docSnap.data();
              list.push({
                _id: docSnap.id,
                id: docSnap.id,
                ...d,
                cost: d.budget || d.cost || 0,
                note: d.description || d.note || "",
              });
            });
            // If firestore produces list, use it; fallback to API
            setActivities(list.length > 0 ? list : apiList);
          }
          setLoading(false);
        }, (err) => {
          console.warn("[TripActivitiesPage] Firestore snapshot error, fallback to API:", err);
          setActivities(apiList);
          setLoading(false);
        });

      } catch (err) {
        console.error("[TripActivitiesPage] Load error:", err);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsub) unsub();
    };
  }, [tripId]);

  // ── Filtered activities ────────────────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchDay = selectedDay === "all" || Number(act.day) === Number(selectedDay);
      const matchCat = categoryFilter === "All" || (act.category || "").toLowerCase() === categoryFilter.toLowerCase();
      const matchSearch =
        (act.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (act.place || "").toLowerCase().includes(search.toLowerCase()) ||
        (act.note || "").toLowerCase().includes(search.toLowerCase());

      return matchDay && matchCat && matchSearch;
    }).sort((a, b) => (Number(a.day) - Number(b.day)) || (a.time || "").localeCompare(b.time || ""));
  }, [activities, selectedDay, categoryFilter, search]);

  // ── Summary Metrics ────────────────────────────────────────────────────────
  const totalCost = useMemo(() => {
    return activities.reduce((acc, curr) => acc + Number(curr.cost || curr.budget || 0), 0);
  }, [activities]);

  const completedCount = useMemo(() => {
    return activities.filter(a => a.status === "Completed").length;
  }, [activities]);

  const progressPercent = useMemo(() => {
    if (activities.length === 0) return 0;
    return Math.round((completedCount / activities.length) * 100);
  }, [activities, completedCount]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDelete = async (actId) => {
    try {
      setDeletingId(actId);

      // Delete from Firestore
      try {
        const docRef = doc(db, "trips", tripId, "itinerary", actId);
        await deleteDoc(docRef);
      } catch (fErr) {
        console.warn("[TripActivitiesPage] Firestore delete fallback:", fErr);
      }

      // Delete from MongoDB API
      const token = localStorage.getItem("token");
      await fetch(getApiUrl(`trips/${tripId}/activities/${actId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      setActivities(prev => prev.filter(a => (a._id || a.id) !== actId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("[TripActivitiesPage] Delete failed:", err);
      alert("Failed to delete activity.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (activity) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`trips/${tripId}/activities`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `${activity.title} (Copy)`,
          day: activity.day,
          time: activity.time,
          place: activity.place,
          category: activity.category,
          cost: activity.cost || activity.budget,
          note: activity.note,
          duration: activity.duration,
          rating: activity.rating,
          status: "Planned",
        })
      });
      const data = await res.json();
      if (data.success && data.activity) {
        setActivities(prev => [...prev, data.activity]);
      }
    } catch (err) {
      console.error("[TripActivitiesPage] Duplicate failed:", err);
    }
  };

  const handleMoveDay = async (actId, newDay) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(getApiUrl(`trips/${tripId}/activities/${actId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ day: Number(newDay) })
      });
      setActivities(prev => prev.map(a => (a._id === actId || a.id === actId) ? { ...a, day: Number(newDay) } : a));
    } catch (err) {
      console.error("[TripActivitiesPage] Move day failed:", err);
    }
  };

  const handleExportPDF = () => {
    const token = localStorage.getItem("token");
    window.open(getApiUrl(`trips/${tripId}/export-pdf?token=${token}`), "_blank");
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="text-teal-500 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading trip activities…</p>
        </div>
      </MainLayout>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">

        {/* 1. TOP TRIP HEADER NAV */}
        <TripHeaderNav trip={trip} tripId={tripId} activeFeature="activities" />

        {/* 2. HERO SUMMARY BANNER */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm py-6">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              {/* Title & Metadata */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-wider border border-teal-200 dark:border-teal-800">
                    📍 Trip Activities
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {trip?.destination || "Destination"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {trip?.title || "Trip Activities"}
                </h1>

                {/* Metrics strip */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                    <Compass size={14} className="text-teal-500" />
                    <span>{activities.length} Total Activities</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                    <DollarSign size={14} className="text-emerald-500" />
                    <span>Est. Cost: ₹{totalCost.toLocaleString("en-IN")}</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                    <Calendar size={14} className="text-indigo-500" />
                    <span>{daysCount} Days</span>
                  </span>
                </div>
              </div>

              {/* Progress & Quick Action CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Progress Card */}
                {activities.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 min-w-[180px]">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-teal-600 dark:text-teal-400">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/explore?importToTrip=${tripId}`)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Import From Explore</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Export PDF</span>
                  </button>

                  <button
                    onClick={() => navigate(`/trips/${tripId}/activities/new`)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-teal-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add Activity</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* 3. MAIN CONTENT CONTAINER */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* DAY TABS + CATEGORY & SEARCH FILTER BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-4">
            
            {/* Day selector tabs */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => setSelectedDay("all")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDay === "all"
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                All Days ({activities.length})
              </button>

              {Array.from({ length: daysCount }, (_, i) => i + 1).map(dayNum => {
                const dayCount = activities.filter(a => Number(a.day) === dayNum).length;
                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum.toString())}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                      selectedDay === dayNum.toString()
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    Day {dayNum} {dayCount > 0 && `(${dayCount})`}
                  </button>
                );
              })}
            </div>

            {/* Filters row: Search + Category chips */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Search bar */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 w-full sm:w-64">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search activities..."
                  className="bg-transparent outline-none text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 w-full"
                />
              </div>

              {/* Category chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar w-full sm:flex-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Category:
                </span>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                      categoryFilter === cat
                        ? "bg-teal-500 text-white border-teal-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 4. ACTIVITIES GRID / TIMELINE */}
          {activities.length === 0 ? (
            /* EMPTY STATE */
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-5 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 text-teal-500 flex items-center justify-center text-4xl mx-auto ring-8 ring-teal-500/10">
                🪂
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">No activities added yet</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Build your adventure! Browse agent-published activities from Explore or create your own custom activity for this trip.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate(`/explore?importToTrip=${tripId}`)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Browse Explore</span>
                </button>

                <button
                  onClick={() => navigate(`/trips/${tripId}/activities/new`)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:scale-105 transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Create Custom Activity</span>
                </button>
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            /* NO FILTER MATCH */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Search size={28} className="text-slate-400 mx-auto" />
              <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">No matching activities found</h4>
              <p className="text-xs text-slate-400">Try clearing search or changing the selected day/category filter.</p>
              <button
                onClick={() => { setSelectedDay("all"); setCategoryFilter("All"); setSearch(""); }}
                className="mt-2 text-xs font-extrabold text-teal-600 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            /* ACTIVITIES LIST */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((act, idx) => {
                const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                const actId = act._id || act.id;
                const isConfirming = confirmDeleteId === actId;

                return (
                  <motion.div
                    key={actId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                  >
                    {/* Header Banner / Photo */}
                    <div className="relative h-40 w-full overflow-hidden" style={{ background: gradient }}>
                      {act.image ? (
                        <img src={act.image} alt={act.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl select-none opacity-80">
                          🎯
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
                          Day {act.day}
                        </span>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ${
                          act.status === "Completed"
                            ? "bg-emerald-500/90 text-white"
                            : act.status === "In Progress"
                            ? "bg-amber-500/90 text-white"
                            : "bg-white/90 text-slate-800"
                        }`}>
                          {act.status || "Planned"}
                        </span>
                      </div>

                      {/* Category & Title on image */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[10px] font-extrabold text-teal-300 uppercase tracking-wider block">
                          {act.category || "Sightseeing"}
                        </span>
                        <h3 className="font-extrabold text-base leading-tight truncate">{act.title}</h3>
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">

                        {/* Location */}
                        {act.place && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <MapPin size={13} className="text-teal-500 shrink-0" />
                            <span className="truncate">{act.place}</span>
                          </div>
                        )}

                        {/* Time & Duration */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          {act.time && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} className="text-blue-500" /> {act.time}
                            </span>
                          )}
                          {act.duration && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} className="text-violet-500" /> {act.duration}
                            </span>
                          )}
                          {act.rating && (
                            <span className="flex items-center gap-1 font-bold text-amber-500 ml-auto">
                              <Star size={11} className="fill-amber-400" /> {act.rating}
                            </span>
                          )}
                        </div>

                        {/* Cost */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Cost</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            ₹{Number(act.cost || act.budget || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Notes */}
                        {act.note && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                            "{act.note}"
                          </p>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        {isConfirming ? (
                          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-rose-600">Delete this activity?</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(actId)}
                                disabled={deletingId === actId}
                                className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-extrabold hover:bg-rose-600 transition-all cursor-pointer"
                              >
                                {deletingId === actId ? <Loader2 size={10} className="animate-spin" /> : "Yes"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between flex-wrap gap-1 text-xs">
                            {/* Left actions */}
                            <div className="flex items-center gap-1">
                              {/* Edit */}
                              <button
                                onClick={() => navigate(`/trips/${tripId}/activities/${actId}/edit`)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors cursor-pointer"
                                title="Edit Activity"
                              >
                                <Edit3 size={13} />
                              </button>

                              {/* Duplicate */}
                              <button
                                onClick={() => handleDuplicate(act)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Duplicate Activity"
                              >
                                <Copy size={13} />
                              </button>

                              {/* Open Maps */}
                              {act.place && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.place)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors"
                                  title="Open Google Maps"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => setConfirmDeleteId(actId)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors cursor-pointer"
                                title="Delete Activity"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Move Day Selector */}
                            <select
                              value={act.day}
                              onChange={(e) => handleMoveDay(actId, e.target.value)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border-none outline-none cursor-pointer"
                              title="Move to another Day"
                            >
                              {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                                <option key={d} value={d}>Move Day {d}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
};

export default TripActivitiesPage;
