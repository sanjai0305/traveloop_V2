// src/pages/TravelJournal.jsx — Travel Journal per-day entries with photos & moods

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import PageHeader from "../components/common/PageHeader";
import DesktopDialog from "../components/common/DesktopDialog";
import EmptyState from "../components/common/EmptyState";
import { getApiUrl } from "../utils/api";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/mobile/MobileToast";
import {
  BookOpen, Plus, ChevronDown, ChevronUp, Camera, X,
  Trash2, Edit3, Star, Calendar, Download, Share2, Printer, Settings
} from "lucide-react";
import { db } from "../services/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

const MOODS = [
  { key: "amazing", emoji: "🤩", label: "Amazing" },
  { key: "great",   emoji: "😊", label: "Great"   },
  { key: "okay",    emoji: "😐", label: "Okay"    },
  { key: "tired",   emoji: "😴", label: "Tired"   },
  { key: "rough",   emoji: "😓", label: "Rough"   },
];

const getMoodEmoji = (key) => MOODS.find(m => m.key === key)?.emoji || "😊";

const EMPTY_ENTRY = { title: "", content: "", mood: "great", highlights: [], photos: [] };

const TravelJournal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const toast = useToast();

  const [trip,       setTrip]       = useState(null);
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [pendingSync, setPendingSync] = useState(false);
  const [expanded,   setExpanded]   = useState(null);
  const [showSheet,  setShowSheet]  = useState(false);
  const [editing,    setEditing]    = useState(null); // entry _id being edited
  const [saving,     setSaving]     = useState(false);

  // Form state
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [formDay, setFormDay] = useState(1);
  const [newHighlight, setNewHighlight] = useState("");

  // Compute trip duration
  const tripDays = (() => {
    if (!trip?.startDate || !trip?.endDate) return 7;
    return Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000));
  })();

  const isViewer = trip?.role === "viewer";

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // 1. Fetch trip
      const tripRes = await fetch(getApiUrl(`trips/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tripData = await tripRes.json();
      if (tripData.success) setTrip(tripData.trip);

      // 2. Fetch journal entries from backend API
      const journalRes = await fetch(getApiUrl(`journal/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const journalData = await journalRes.json();
      if (journalData.success && Array.isArray(journalData.entries)) {
        // Sort by day asc
        const list = [...journalData.entries].sort((a, b) => a.day - b.day);
        setEntries(list);
      } else {
        toast.error(journalData.message || "Failed to load journal entries");
      }
    } catch (err) {
      console.error("Error loading journal details:", err);
      toast.error(err.message || "Network error loading journal entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [id]);

  const openAdd = (day) => {
    setEditing(null);
    setFormDay(day);
    setForm({ ...EMPTY_ENTRY });
    setNewHighlight("");
    setShowSheet(true);
  };

  const openEdit = (entry) => {
    setEditing(entry._id || entry.id);
    setFormDay(entry.day);
    setForm({
      title: entry.title || "",
      content: entry.content || entry.description || "",
      mood: entry.mood || "great",
      highlights: [...(entry.highlights || [])],
      photos: [...(entry.photos || [])],
    });
    setNewHighlight("");
    setShowSheet(true);
  };

  const handleSave = async () => {
    if (isViewer) {
      toast.error("Permission denied: You do not have permission to edit this journal");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Validation failed: Title is required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication expired: Please log in again");
        setSaving(false);
        return;
      }

      const entryDayDate = trip?.startDate
        ? new Date(new Date(trip.startDate).getTime() + (formDay - 1) * 86400000).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const payload = {
        tripId: id,
        day: Number(formDay),
        dayId: Number(formDay),
        date: entryDayDate,
        title: form.title.trim(),
        content: form.content || "",
        description: form.content || "",
        mood: form.mood || "great",
        highlights: form.highlights || [],
        photos: form.photos || [],
        timestamp: new Date().toISOString(),
      };

      const url = editing ? getApiUrl(`journal/${editing}`) : getApiUrl("journal");
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Journal entry saved successfully.");
        await fetchEntries();
        setShowSheet(false);
      } else {
        const errorMsg = data.message || `Save failed with status code ${res.status}`;
        console.error("Journal API Save Error:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Journal Save Network/Client Error:", err);
      toast.error(err.message || "Network error while saving journal entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (isViewer) {
      toast.error("Permission denied: You do not have permission to delete entries");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this journal entry?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`journal/${entryId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Journal entry deleted successfully.");
        await fetchEntries();
      } else {
        toast.error(data.message || "Failed to delete entry");
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
      toast.error(err.message || "Network error deleting entry");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, photos: [...f.photos, { url: ev.target.result, caption: "" }] }));
    };
    reader.readAsDataURL(file);
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setForm(f => ({ ...f, highlights: [...f.highlights, newHighlight.trim()] }));
    setNewHighlight("");
  };

  const removeHighlight = (idx) => {
    setForm(f => ({ ...f, highlights: f.highlights.filter((_, i) => i !== idx) }));
  };

  const daysArray = Array.from({ length: tripDays }, (_, i) => i + 1);
  const entryMap = {};
  entries.forEach(e => { entryMap[e.day] = e; });

  if (loading) {
    return (
      <MainLayout>
        <div className="px-4 pt-4 space-y-3">
          <div className="h-14 skeleton rounded-[18px]" />
          {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-[20px]" />)}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-mobile-nav">
        <PageHeader
          title="Travel Journal"
          subtitle="Document memories, notes, experiences and activities throughout your journey."
          tripTitle={trip?.title}
          tripId={id}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Download size={14} /> Export PDF
              </button>
              <button
                onClick={() => navigator.share ? navigator.share({ title: trip?.title, url: window.location.href }) : alert("Link copied to clipboard!")}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Share2 size={14} /> Share
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={() => navigate(`/build-itinerary/${id}`)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Settings size={14} /> Settings
              </button>
            </div>
          }
        />

        {/* Empty State Callout */}
        {entries.length === 0 && (
          <EmptyState
            icon="📖"
            title="No journal entries yet."
            subtitle="Start documenting your trip by adding memories, notes, photos and expenses throughout your journey."
            primaryAction={
              !isViewer && (
                <button
                  onClick={() => openAdd(1)}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-extrabold shadow-md hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Create Entry
                </button>
              )
            }
            secondaryAction={
              <button
                onClick={() => navigate(`/trip-notes/${id}`)}
                className="px-6 py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Import Notes
              </button>
            }
          />
        )}

        {/* Day list */}
        <div className="space-y-3">
          {daysArray.map((day) => {
            const entry = entryMap[day];
            const isExpanded = expanded === day;
            const dayDate = trip?.startDate
              ? new Date(new Date(trip.startDate).getTime() + (day - 1) * 86400000).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
              : `Day ${day}`;

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: day * 0.03 }}
                className="premium-card overflow-hidden"
              >
                {/* Day header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : day)}
                >
                  <div
                    className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 text-white font-extrabold text-sm"
                    style={{ background: entry ? "linear-gradient(135deg,#14B8B5,#0D9488)" : "rgba(148,163,184,0.15)" }}
                  >
                    {entry ? getMoodEmoji(entry.mood) : day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {entry ? entry.title : `Day ${day}`}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar size={10} />
                      {dayDate}
                      {entry && <span className="ml-1">• {entry.highlights?.length || 0} highlights</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!entry ? (
                      !isViewer && (
                        <button
                          onClick={(e) => { e.stopPropagation(); openAdd(day); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-white font-bold text-[11px] active:scale-95"
                          style={{ background: "linear-gradient(135deg,#14B8B5,#0D9488)" }}
                        >
                          <Plus size={12} /> Add
                        </button>
                      )
                    ) : (
                      <>
                        {!isViewer && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(entry); }}
                            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {isExpanded
                          ? <ChevronUp size={16} className="text-slate-400" />
                          : <ChevronDown size={16} className="text-slate-400" />
                        }
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && entry && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
                        {/* Content */}
                        {entry.content && (
                          <p className="text-sm text-slate-600 leading-relaxed">{entry.content}</p>
                        )}

                        {/* Highlights */}
                        {entry.highlights?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.highlights.map((h, i) => (
                              <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                <Star size={10} /> {h}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Photos */}
                        {entry.photos?.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {entry.photos.map((p, i) => (
                              <div key={i} className="aspect-square rounded-[12px] overflow-hidden bg-slate-100">
                                <img src={p.url} alt={p.caption || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Delete button */}
                        {!isViewer && (
                          <button
                            onClick={() => handleDelete(entry._id)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 mt-1"
                          >
                            <Trash2 size={12} /> Delete entry
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── ENTRY EDITOR DESKTOP DIALOG ── */}
      <DesktopDialog
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        title={editing ? "Edit Journal Entry" : `Day ${formDay} Journal`}
        subtitle="Capture memories, feelings, photos, and highlights from this day"
        icon="📖"
        size="xl"
        footer={
          <div className="flex items-center gap-3 justify-end w-full">
            <button
              onClick={() => setShowSheet(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update Entry" : "Save Journal Entry"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">

          {/* Mood selector */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">How was the day?</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setForm(f => ({ ...f, mood: m.key }))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all ${form.mood === m.key ? "bg-teal-500 text-white border-teal-500" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                >
                  <span>{m.emoji}</span>{m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Title *</p>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Tokyo Tower & Shibuya Crossing"
              className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm font-bold bg-slate-50 text-slate-700 outline-none focus:border-teal-400 transition-colors"
              style={isDark ? { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" } : {}}
            />
          </div>

          {/* Content */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">What happened?</p>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Write about your day, experiences, and memories..."
              rows={4}
              className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm bg-slate-50 text-slate-700 outline-none focus:border-teal-400 transition-colors resize-none"
              style={isDark ? { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" } : {}}
            />
          </div>

          {/* Highlights */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Highlights ⭐</p>
            <div className="flex gap-2 mb-2">
              <input
                value={newHighlight}
                onChange={e => setNewHighlight(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addHighlight()}
                placeholder="Add a highlight..."
                className="flex-1 px-3 py-2.5 rounded-[12px] border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700 outline-none"
                style={isDark ? { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" } : {}}
              />
              <button onClick={addHighlight} className="px-4 py-2.5 rounded-[12px] text-white text-xs font-bold bg-amber-500 active:scale-95">
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.highlights.map((h, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                  {h}
                  <button onClick={() => removeHighlight(i)} className="ml-0.5 text-amber-400 hover:text-red-500">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Photos 📷</p>
            <label className="flex items-center gap-2 px-4 py-3 rounded-[14px] border border-dashed border-slate-300 text-slate-500 text-xs font-bold cursor-pointer active:scale-95 transition-all hover:border-teal-400 hover:text-teal-600">
              <Camera size={16} /> Add Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {form.photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-[12px] overflow-hidden bg-slate-100">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DesktopDialog>
    </MainLayout>
  );
};

export default TravelJournal;
